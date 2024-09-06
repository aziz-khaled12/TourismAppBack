const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");
const admin = require("firebase-admin");
const multer = require("multer");
const path = require("path");


const bucket = admin.storage().bucket();
// Multer setup for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });


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


// Function to insert menu item into the database
const insertMenuItem = async (type, name, price, descr, imageUrl, menuId, res) => {
  try {
    const insertQuery = `
      INSERT INTO menu_items (type, name, price, descr, rating, image_url, menu_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const insertValues = [type, name, price, descr, 0, imageUrl ? [imageUrl] : null, menuId];

    const result = await pool.query(insertQuery, insertValues);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting menu item into the database:", error);
    res.status(500).json({ error: "Internal Server Error" });
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


  try {

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



router.get("/menu/items", authenticateUser, async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.query(
      "SELECT mi.* FROM menu_items mi INNER JOIN menu m ON mi.menu_id = m.id INNER JOIN restaurant r ON m.restaurant_id = r.id WHERE r.id = $1;",
      [id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
  }
});


router.post("/menu/items", authenticateUser, upload.single("image"), async (req, res) => {
  const { id } = req.query; // restaurant id
  const { type, name, price, descr } = req.body;

  try {
    // Fetch the restaurant name
    const restoQuery = "SELECT name FROM restaurant WHERE id = $1";
    const resto = await pool.query(restoQuery, [id]);

    if (resto.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Fetch the menu ID for the given restaurant
    const menuQuery = "SELECT id FROM menu WHERE restaurant_id = $1";
    const menuResult = await pool.query(menuQuery, [id]);

    if (menuResult.rows.length === 0) {
      return res.status(404).json({ error: "Menu not found for this restaurant" });
    }

    const menuId = menuResult.rows[0].id;
    let imageUrl = null;

    // Handle file upload if provided
    if (req.file) {
      const file = req.file;
      const destination = `restaurants/${resto.rows[0].name}/menu/${file.originalname}-${Date.now()}${path.extname(file.originalname)}`;

      // Upload file to Firebase Storage directly from memory
      const blob = bucket.file(destination);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype, // Set correct MIME type
        },
        public: true, // Make the file publicly accessible
      });

      blobStream.on("error", (err) => {
        console.error("File upload error:", err);
        res.status(500).json({ error: "File upload failed" });
      });

      blobStream.on("finish", () => {
        // Get the public URL for the uploaded file
        imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

        // Insert the menu item into the database after the file upload is complete
        insertMenuItem(type, name, price, descr, imageUrl, menuId, res);
      });

      // Pipe the file data to the stream
      blobStream.end(file.buffer);
    } else {
      // If no file is provided, just insert the item without an image
      insertMenuItem(type, name, price, descr, imageUrl, menuId, res);
    }
  } catch (error) {
    console.error("Error inserting menu item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;
