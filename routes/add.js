const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const upload = multer({ dest: "uploads/" });

const bucket = admin.storage().bucket();

router.post("/taxi", upload.none(), authenticateUser, async (req, res) => {
  const { matricule, user_id } = req.body;

  try {
    const result = await pool.query(
      `
            WITH vehicle_insert AS (
                INSERT INTO vehicles (matricule)
                VALUES ($1)
                RETURNING id AS vehicle_id, matricule
            ),
            taxi_insert AS (
                INSERT INTO taxi (vehicle_id, rating)
                VALUES ((SELECT vehicle_id FROM vehicle_insert), 0)
                RETURNING id AS taxi_id, vehicle_id
            )
            INSERT INTO vehicle_ownership (owner_id, vehicle_id, owner_type)
            VALUES ($2, (SELECT vehicle_id FROM vehicle_insert), $3)
            RETURNING vehicle_id;
        `,
      [matricule, user_id, "user"]
    );

    console.log(result.rows);

    // Extract data from the query results
    const vehicle = {
      vehicle_id: result.rows[0].vehicle_id,
      matricule: matricule,
    };

    const taxi = {
      id: result.rows[1]?.taxi_id,
      vehicle_id: result.rows[1]?.vehicle_id,
    };

    res.status(200).json({ vehicle, taxi });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.post(
  "/hotel",
  authenticateUser,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        owner_id,
        name,
        lon,
        lat,
        work_start,
        work_end,
        road,
        city,
        state,
        country,
        description,
      } = req.body;

      console.log("Request body:", req.body);

      let imageUrl = null;

      if (req.file) {
        try {
          const file = req.file;
          const destination = `hotels/${
            file.filename
          }-${Date.now()}${path.extname(file.originalname)}`;

          await bucket.upload(file.path, {
            destination: destination,
            public: true, // Ensures the file is publicly accessible
            metadata: {
              contentType: file.mimetype, // Sets the correct content type
            },
          });

          imageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
          fs.unlinkSync(file.path); // Remove the file from the local server
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          return res
            .status(500)
            .json({ message: "File upload failed", error: uploadError });
        }
      }

      imageUrl = [imageUrl];

      // Insert the hotel data into the database
      try {
        const newHotel = await pool.query(
          `
        INSERT INTO hotels 
          (owner_id, name, lon, lat, location, work_start, work_end, road, city, state, country, image_url, description, rating) 
        VALUES 
          ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9, $10, $11, $12, $13) 
        RETURNING *`,
          [
            owner_id,
            name,
            lon,
            lat,
            work_start,
            work_end,
            road,
            city,
            state,
            country,
            imageUrl,
            description,
            0
          ]
        );

        res.status(200).json(newHotel.rows[0]);
      } catch (dbError) {
        console.error("Database query error:", dbError);
        res.status(500).json({ message: "Database error", error: dbError });
      }
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.post(
  "/restaurant",
  authenticateUser,
  upload.single("image"),
  async (req, res) => {
    const {
      owner_id,
      name,
      lon,
      lat,
      work_start,
      work_end,
      road,
      city,
      state,
      country,
      description,
    } = req.body;

    let imageUrl = null;

    if (req.file) {
      const file = req.file;
      const destination = `restaurants/${
        file.filename
      }-${Date.now()}${path.extname(file.originalname)}`;

      await bucket.upload(file.path, {
        destination: destination,
        public: true, // Ensures the file is publicly accessible
        metadata: {
          contentType: file.mimetype, // Sets the correct content type
        },
      });

      imageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

      // Delete the file from the local server after uploading
      fs.unlinkSync(file.path);
    }

    imageUrl = [imageUrl]

    try {
      const newRestaurant = await pool.query(
        "INSERT INTO restaurant (owner_id, name, lon, lat, location, work_start, work_end, road, city, state, country, description, image_url, rating) VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
        [
          owner_id,
          name,
          lon,
          lat,
          work_start,
          work_end,
          road,
          city,
          state,
          country,
          description,
          imageUrl,
          0,
        ]
      );
      res.json(newRestaurant.rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

module.exports = router;
