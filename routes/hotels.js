const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Set the destination folder for uploads
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize upload variable with multer configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // Optional: Set file size limit (10MB in this case)
}).single("image"); // 'image' is the name of the field in the form

router.post("/room", authenticateUser, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).send("Error uploading file.");
    }

    const { capacity, number, price, hotel_id } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!capacity || !number || !price || !image || !hotel_id) {
      return res.status(400).send("Please provide all required fields.");
    }

    try {
      const query = `
        INSERT INTO hotel_rooms (hotel_id, number, capacity, price, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`;
      const values = [hotel_id, number, capacity, price, image];

      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error inserting room:", error);
      res.status(500).send("Server error.");
    }
  });
});


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

router.get("/rooms/:hotelId", authenticateUser, async (req, res) => {
  const {hotelId} = req.params;
  try {
    const result = await pool.query("SELECT * FROM hotel_rooms WHERE hotel_id=$1", [hotelId]);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
  }
})


module.exports = router;
