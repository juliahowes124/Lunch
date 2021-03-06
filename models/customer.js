"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  get fullName() {
    return this.firstName + " " + this.lastName;
  }

  get notes() {
    return this._notes;
  }

  set notes(val) {
    if (!val) {
      this._notes = "";
    } else {
      this._notes = val;
    }
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`
    );
    let customers = await Promise.all(results.rows.map(async c => {
      let newCustomer = new Customer(c);
      return newCustomer;
    }));
    return customers;
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** get most recent reservation for this customer */
  async getMostRecent() {
    const reservation = await Reservation.getRecentReservation(this.id);
    return reservation;
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this._notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }

  // Queries for customers that have names with term in them
  static async searchName(term) {
    const result = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name AS "lastName",
              phone,
              notes AS "_notes"
        FROM customers
        WHERE to_tsvector(first_name || ' ' || last_name) @@ to_tsquery($1)
        OR to_tsvector(CAST(id as varchar(10))) @@ to_tsquery($1)
        ORDER BY last_name, first_name`,
        [`${term}:*`]
      );

    return result.rows.map(c => new Customer(c));
  }

  static async getBest() {
    const results = await db.query(
      `
      SELECT c.id,
            first_name AS "firstName",
            last_name AS "lastName",
            phone,
            c.notes AS "_notes",
            COUNT(*) AS "resCount"
      FROM customers as c
      JOIN reservations
      ON reservations.customer_id = c.id
      GROUP BY c.id, first_name, last_name, phone, c.notes
      ORDER BY COUNT(*) DESC
      LIMIT 10
      `
    )

    return results.rows.map(c => {
      let customer = new Customer(c);
      customer.resCount = c.resCount;
      return customer;
    });
  }
}

module.exports = Customer;
