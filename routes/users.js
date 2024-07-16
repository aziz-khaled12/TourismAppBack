const express = require("express");
const router = express.Router();
const pool = require("../db");


router.get("/roles", async (req, res) => {
  try {
    const roles = await pool.query("SELECT * FROM roles")
    res.json(roles.rows)
  } catch (error) {
    console.log(error)
    res.status(500)
  }
})


module.exports = router;
