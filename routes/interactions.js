const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");

router.post("/like", authenticateUser, async (req, res) => {
  const { user_id, entity_id, entity_type } = req.body;

  try {
    // Check if the like already exists
    const existingLike = await pool.query(
      "SELECT * FROM likes WHERE user_id = $1 AND entity_id = $2 AND entity_type = $3",
      [user_id, entity_id, entity_type]
    );

    if (existingLike.rows.length > 0) {
      return res.status(400).json({ message: "You already liked this entity" });
    }

    // Insert the new like
    await pool.query(
      "INSERT INTO likes (user_id, entity_id, entity_type) VALUES ($1, $2, $3)",
      [user_id, entity_id, entity_type]
    );

    res.status(200).json({ message: "Entity liked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.delete("/unlike", authenticateUser, async (req, res) => {
  const { entity_id, entity_type } = req.body;
  const { user_id } = req.query;
  try {
    await pool.query(
      "DELETE FROM likes WHERE user_id = $1 AND entity_id = $2 AND entity_type = $3",
      [user_id, entity_id, entity_type]
    );

    res.status(200).json({ message: "Entity unliked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/booking", authenticateUser, async (req, res) => {
  console.log("Request Body:", req.body);

  const {
    user_id,
    hotel_id,
    person_number,
    room_id,
    total_price,
    booking_start,
    booking_end,
  } = req.body;

  console.log(req.body);
  try {
    const booking = await pool.query(
      "INSERT INTO hotel_booking (user_id, hotel_id, person_number, room_id, total_price, booking_start, booking_end) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        user_id,
        hotel_id,
        person_number,
        room_id,
        total_price,
        booking_start,
        booking_end,
      ]
    );
    res.status(200).json({ message: "Room Booked succefully" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});


router.get("/bookings", authenticateUser, async (req, res) => {
  const { hotel_id } = req.query;
  try {
    const booking = await pool.query(
      "SELECT * FROM hotel_booking WHERE hotel_id = $1",
      [hotel_id]
    );
    res.status(200).json(booking.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "enternal error" });
  }
});


router.delete("/bookings", authenticateUser, async (req, res) => {
  const { booking_id } = req.query;
  console.log(req.query)
  try {
    const booking = await pool.query("DELETE FROM hotel_booking WHERE id=$1 RETURNING *", [
      booking_id,
    ]);

    if (booking.rows.length === 0) {
      return res
        .status(404)
        .send("Booking not found or does not match the provided details.");
    }
    res.status(200).json({ message: "Booking Deleted", booking: booking.rows});
  } catch (error) {}
});

module.exports = router;
