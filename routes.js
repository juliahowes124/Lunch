"use strict";

const { SearchSource } = require("@jest/core");
/** Routes for Lunchly */

const express = require("express");
const moment = require('moment');

const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  let customers;
  let searchTerm = req.query.search;
  if (searchTerm) {
    customers = await Customer.searchName(searchTerm);
  } else {
    customers = await Customer.all();
  }
  let mostRecentReservations = [];
  for(let customer of customers) {
    let recent = await customer.getMostRecent();
    mostRecentReservations.push(recent);
  }
  mostRecentReservations = mostRecentReservations.map(r => {
    return r ? {startAt: moment(r.startAt).format("MM/DD/YYYY @ h:mm a")} : null;
  })
  return res.render("customer_list.html", { customers, mostRecentReservations });
});


router.get('/best', async function (req, res) {
  let bestCustomers = await Customer.getBest();
  return res.render("customer_best.html", { bestCustomers })
});

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  return res.render("customer_new_form.html");
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes:0 });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  const reservations = await customer.getReservations();
  return res.render("customer_detail.html", { customer, reservations });
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  res.render("customer_edit_form.html", { customer });
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName || null;
  customer.lastName = req.body.lastName || null;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  const customerId = req.params.id;
  const startAt = new Date(req.body.startAt);
  const numGuests = req.body.numGuests;
  const notes = req.body.notes;

  const reservation = new Reservation({
    customerId,
    startAt,
    numGuests,
    notes,
  });

  console.log(reservation);

  await reservation.save();

  return res.redirect(`/${customerId}/`);
});

router.get("/:id/edit-reservation/", async function (req,res) {
  const customer = await Customer.get(req.params.id);
  return res.render("reservation_edit_form.html", customer)
})

// router.post("/:id/edit-reservation/")


module.exports = router;
