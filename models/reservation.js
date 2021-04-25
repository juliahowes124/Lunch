"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const { BadRequestError } = require("../expressError");



/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  get numGuests() {
    return this._numGuests
  }

  set numGuests(val) {
    if (val >= 1) {
      this._numGuests = val;
    } else {
      throw new BadRequestError();
    }
  }

  get startAt() {
    return this._startAt;
  }

  set startAt(val) {
    if (val instanceof Date) {
      this._startAt = val;
    } else {
      throw new BadRequestError();
    }
  }

  get customerId() {
    return this._customerId;
  }

  set customerId(val) {
    this._customerId = val;
    // throw new BadRequestError();
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** given a customer id, find their most recent reservation. */
  static async getRecentReservation(customerId) {
    const results = await db.query(
      `SELECT num_guests AS "numGuests",
              start_at AS "startAt"
       FROM reservations
       WHERE customer_id = $1
       ORDER BY start_at DESC
       LIMIT 1`,
    [customerId]
    );
    return results.rows.length ? new Reservation(results.rows[0]) : null;
  }

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
        await db.query(
          `UPDATE reservations
            SET num_guests, start_at, notes
            VALUES ($1, $2, $3)
            WHERE id = $4
          `,
          [this.numGuests, this.startAt, this.notes, this.id]
        )
    }
  }
}


module.exports = Reservation;
