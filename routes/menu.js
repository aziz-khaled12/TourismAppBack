const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");
const path = require("path");
const admin = require("firebase-admin");
const multer = require("multer");

const bucket = admin.storage().bucket();
// Multer setup for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Function to insert menu item into the database
const insertMenuItem = async (
  type,
  name,
  price,
  descr,
  imageUrl,
  menuId,
  res
) => {
  try {
    const insertQuery = `
        INSERT INTO menu_items (type, name, price, descr, rating, image_url, menu_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const insertValues = [
      type,
      name,
      price,
      descr,
      0,
      imageUrl ? [imageUrl] : null,
      menuId,
    ];

    const result = await pool.query(insertQuery, insertValues);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting menu item into the database:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

router.get("/items", authenticateUser, async (req, res) => {
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

router.post(
  "/items",
  authenticateUser,
  upload.single("image"),
  async (req, res) => {
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
        return res
          .status(404)
          .json({ error: "Menu not found for this restaurant" });
      }

      const menuId = menuResult.rows[0].id;
      let imageUrl = null;

      // Handle file upload if provided
      if (req.file) {
        const file = req.file;
        const destination = `restaurants/${resto.rows[0].name}/menu/${
          file.originalname
        }-${Date.now()}${path.extname(file.originalname)}`;

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
  }
);
router.put(
  "/items",
  authenticateUser,
  upload.single("image"),
  async (req, res) => {
    const itemId = req.query.id;
    const { type, name, price, descr, oldImageUrl, restaurantName } = req.body;

    try {
      let imageUrl = oldImageUrl;

      if (req.file) {
        if (oldImageUrl) {
          const filePath = oldImageUrl.split(`${bucket.name}/`)[1];
          const file = bucket.file(filePath);

          const [exists] = await file.exists();

          if (exists) {
            await file.delete();
          } else {
            console.log("File does not exist, no deletion needed");
          }
        }

        const file = req.file;
        const destination = `restaurants/${restaurantName}/menu/${
          file.originalname
        }-${Date.now()}${path.extname(file.originalname)}`;

        const blob = bucket.file(destination);

        // Wrap the upload process in a promise
        await new Promise((resolve, reject) => {
          const blobStream = blob.createWriteStream({
            metadata: {
              contentType: file.mimetype,
            },
            public: true,
          });

          blobStream.on("error", (err) => {
            console.error("File upload error:", err);
            reject(err); // Reject the promise on error
          });

          blobStream.on("finish", () => {
            imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(); // Resolve the promise on success
          });

          blobStream.end(file.buffer);
        });
      }

      if (imageUrl === oldImageUrl) {
        console.log("Image URL did not change");
      } else {
        console.log("Image URL changed :", imageUrl);
      }

      // Update the database with the new image URL
      const query = `
        UPDATE menu_items 
        SET type = $1, name = $2, price = $3, descr = $4, image_url = $5
        WHERE id = $6
        RETURNING *`;

      const values = [type, name, price, descr, [imageUrl], itemId]; // imageUrl should not be wrapped in an array
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.delete("/items", authenticateUser, async (req, res) => {
  const { itemId, imageURL, restaurantId } = req.query;

  try {
    // Fetch the menu ID
    const menuIdQuery = await pool.query(
      "SELECT id FROM menu WHERE restaurant_id = $1",
      [restaurantId]
    );

    // Check if the menu exists
    if (menuIdQuery.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Menu not found for the given restaurant" });
    }

    const menu_id = menuIdQuery.rows[0].id;

    // Delete the menu item
    const result = await pool.query(
      "DELETE FROM menu_items WHERE id = $1 AND menu_id = $2 RETURNING *",
      [itemId, menu_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    // If there's an image URL, check if the file exists in Firebase and delete it
    if (imageURL != null) {
      const filePath = imageURL.split(`${bucket.name}/`)[1];
      const file = bucket.file(filePath);

      const [exists] = await file.exists();

      if (exists) {
        await file.delete();
        console.log("File deleted successfully");
      } else {
        console.log("File does not exist, no deletion needed");
      }
    }

    // Respond with the deleted menu item details
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
