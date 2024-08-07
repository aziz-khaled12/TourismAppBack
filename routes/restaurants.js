const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");

const getRestaurantsWithinRadius = async (lat, lon, radius) => {
  console.log("lon: ", lon);
  const query = `
      SELECT *
      FROM restaurant
      WHERE ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3
      );
    `;

  const values = [lon, lat, radius]; // Note the order of lon and lat

  try {
    const res = await pool.query(query, values);
    return res.rows;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};

router.get("/", authenticateUser, async (req, res) => {
  try {
    const restaurants = await pool.query("SELECT * FROM restaurant");
    res.json(restaurants.rows);
  } catch (error) {
    res.status(500).send("Data not available");
  }
});

router.get("/nearby", async (req, res) => {
  const { lat, lon, radius } = req.query;

  console.log("lat: ", lat);

  try {
    console.log("query: ", lon);

    const nearbyRestaurants = await getRestaurantsWithinRadius(
      lat,
      lon,
      radius
    );
    res.json(nearbyRestaurants);
  } catch (error) {
    console.error("Error fetching nearby restaurants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:wilaya", authenticateUser, async (req, res) => {
  const { wilaya } = req.params;

  try {
    const query = "SELECT * FROM restaurant WHERE state=$1";
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
    const result = await pool.query("SELECT * FROM restaurant WHERE id=$1", [
      id,
    ]);
    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
