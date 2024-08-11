const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");



router.get("/data/hotel/:ownerId", authenticateUser, async (req, res) => {
  const { ownerId } = req.params;

  try {
    const query = "SELECT * FROM hotels WHERE owner_id = $1";
    const values = [ownerId];

    const result = await pool.query(query, values);
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).send("No hotels found for this owner.");
    }
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).send("Server error.");
  }
});


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
