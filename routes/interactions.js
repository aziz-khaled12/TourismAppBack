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
  const {user_id} = req.query;
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

module.exports = router;
