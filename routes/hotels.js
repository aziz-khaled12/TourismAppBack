const express = require("express");
const router = express.Router();
const pool = require("../db");
const admin = require("firebase-admin");
const authenticateUser = require("../middlewares/authMiddleware");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY, // Ensure proper formatting
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  }),
  storageBucket: "tourism-app-4f5ec.appspot.com",
});

const bucket = admin.storage().bucket();
// Multer setup for handling file uploads
const upload = multer({ dest: "uploads/" });

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
  const { hotelId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM hotel_rooms WHERE hotel_id=$1",
      [hotelId]
    );
    res.json(result.rows);
  } catch (error) {
    console.log(error);
  }
});

router.post(
  "/room",
  authenticateUser,
  upload.single("image"),
  async (req, res) => {
    const { capacity, number, price, hotel_id } = req.body;

    try {
      let imageUrl = null;

      if (req.file) {
        const file = req.file;
        const destination = `rooms/${file.filename}-${Date.now()}${path.extname(
          file.originalname
        )}`;

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

      const query = `
        INSERT INTO hotel_rooms (hotel_id, number, capacity, price, image_url, occupied, free)
        VALUES ($1, $2, $3, $4, $5, 0, $2)
        RETURNING *`;
      const values = [hotel_id, number, capacity, price, imageUrl];

      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error inserting room:", error);
      res.status(500).send("Server error.");
    }
  }
);

router.put(
  "/room/:id",
  authenticateUser,
  upload.single("image"),
  async (req, res) => {
    const { capacity, number, price, hotel_id, oldImageUrl } = req.body;
    const roomId = req.params.id;

    try {
      let imageUrl = oldImageUrl; // Use the existing image URL by default

      if (req.file) {
        // If a new image is uploaded, delete the old one and upload the new image
        if (oldImageUrl) {
          const filePath = oldImageUrl.split(`${bucket.name}/`)[1];
          await bucket.file(filePath).delete();
        }

        const file = req.file;
        const destination = `rooms/${file.filename}-${Date.now()}${path.extname(
          file.originalname
        )}`;

        await bucket.upload(file.path, {
          destination: destination,
          public: true,
          metadata: {
            contentType: file.mimetype,
          },
        });

        imageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        fs.unlinkSync(file.path); // Delete the local file after upload
      }

      const query = `
        UPDATE hotel_rooms 
        SET hotel_id = $1, number = $2, capacity = $3, price = $4, image_url = $5
        WHERE id = $6
        RETURNING *`;
      const values = [hotel_id, number, capacity, price, imageUrl, roomId];

      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).send("Server error.");
    }
  }
);

router.delete("/room/:id", authenticateUser, async (req, res) => {
  const { hotel_id, number, capacity, price, oldImageUrl } = req.query;
  const roomId = req.params.id;

  try {
    // If an old image URL is provided, delete the image from Firebase Storage
    if (oldImageUrl) {
      const filePath = oldImageUrl.split(`${bucket.name}/`)[1];
      await bucket.file(filePath).delete();
    }

    // Delete the room from the database
    const query = `
        DELETE FROM hotel_rooms 
        WHERE id = $1 AND hotel_id = $2 AND number = $3 AND capacity = $4 AND price = $5
        RETURNING *`;
    const values = [roomId, hotel_id, number, capacity, price];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .send("Room not found or does not match the provided details.");
    }

    res.json({ message: "Room deleted successfully.", room: result.rows });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).send("Server error.");
  }
});

module.exports = router;
