"use strict";

/** Routes for Lunchly */

const express = require("express");

const { BadRequestError } = require("./expressError");
const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  const { search } = req.query;
  if (search !== undefined) {
    const customers = await Customer.search(search);
    return res.render("customer_list.html", { customers });
  }

  const customers = await Customer.all();
  return res.render("customer_list.html", { customers });
});

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  return res.render("customer_new_form.html");
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Handle getting the top 10 customers sorted by reservation count */

router.get("/top-ten/", async function (req, res) {
  const customersAndCounts = await Customer.getTopCustomersAndCounts();
  return res.render("customer_top_list.html", { customersAndCounts });
});

// ---------- START OF URL PARAMETERS '/:id/' ------------

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
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName;
  customer.lastName = req.body.lastName;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
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
  await reservation.save();

  return res.redirect(`/${customerId}/`);
});

// -------- ROUTES FOR RESERVATIONS "/reservations/" -------

/** On GET: display form to edit a reservation
 * On POST: handles submission to edit a reservation */
router.route("/edit-reservation/:id")
  .get(async function (req, res) {
    const reservation = await Reservation.getReservationById(req.params.id);
    return res.render("reservation_edit_form.html", {reservation});
})
  .post(async function (req, res) {
    if (req.body === undefined) {
      throw new BadRequestError();
    }
    const reservation = await Reservation.getReservationById(req.params.id);
    reservation.numGuests = req.body.numGuests;
    reservation.startAt = new Date(req.body.startAt);
    reservation.notes = req.body.notes;
    await reservation.save();

    return res.redirect(`/${reservation.customerId}/`);
})







module.exports = router;
