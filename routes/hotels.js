const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");




router.get("/", authenticateUser, async (req, res) => {
  try {
    const hotels = await pool.query("SELECT * FROM hotels");
    res.json(hotels.rows);
  } catch (error) {
    res.status(404).send("Data not available");
  }
});

router.get("/:wilaya", authenticateUser, async (req, res) => {
  const { wilaya } = req.params;

  try {
    const query = "SELECT * FROM hotels WHERE state=$1";
    const values = [`${wilaya}`];

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).send("Data not available");
  }
});

router.get("/info/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM hotels WHERE id=$1", [id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
  }
});



module.exports = router;