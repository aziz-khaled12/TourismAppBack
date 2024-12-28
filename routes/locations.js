const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");
const wilayaFilePath = path.join(__dirname, "../data/wilayas.json");

const loadLocationData = (LocationPath) => {
  try {
    const data = fs.readFileSync(LocationPath, "utf8");
    const parsedData = JSON.parse(data);
    const filteredData = parsedData.filter((location) =>
      location.hasOwnProperty("name")
    );
    return filteredData;
  } catch (error) {
    console.error("Error loading location data:", error);
    throw error;
  }
};


router.get("/wilaya", authenticateUser, (req, res) => {
  try {
    const wilayas = loadLocationData(wilayaFilePath);
    res.json(wilayas);
  } catch (error) {
    res.status(500).send("Data not available");
  }
});

router.get("/", authenticateUser, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM places");

    res.json(result.rows);
  } catch (error) {}
});

router.get("/:wilaya", authenticateUser, async (req, res) => {
  const { wilaya } = req.params;
  try {
    const query = "SELECT * FROM places WHERE state=$1 ORDER BY rating DESC";
    const values = [`${wilaya}`];

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(500).send("Data not available");
  }
});

router.get("/:wilaya/best", authenticateUser, async (req, res) => {
  const { wilaya } = req.params;
  const { limit } = req.query;

  try {
    const query =
      "SELECT * FROM places WHERE state=$1 ORDER BY rating DESC LIMIT $2";
    const values = [`${wilaya}`, limit];

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(500).send("Data not available");
  }
});


router.get("/info/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  try {
    const query = "SELECT * FROM places WHERE id=$1";
    const values = [`${id}`];

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
