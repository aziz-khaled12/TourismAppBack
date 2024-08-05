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

module.exports = router;
