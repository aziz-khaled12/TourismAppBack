const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateUser = require("../middlewares/authMiddleware");

const getUserByEmail = async (email) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
    console.log("user: ", user);
    return user;
  } catch (err) {
    console.error("Error executing query", err.stack);
    throw err;
  }
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

router.post("/login", async (req, res) => {
  try {
    console.log("log body: ", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log("match: ", passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ user_data: user }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Error during login" });
  }
});

router.post("/signup", async (req, res) => {
  const { email, password, username, role } = req.body;
  // Validate role_id
  const validRoles = [1, 2, 3, 4, 5]; // User, Hotel, Agency, Taxi, Restaurant
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role_id" });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const newUser = await pool.query(
      "INSERT INTO users (email, password, username, role_id) VALUES($1, $2, $3, $4) RETURNING *",
      [email, hashedPassword, username, role]
    );

    

    const token = jwt.sign({ user_data: newUser.rows[0] }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ message: "signup successful", token });
  } catch (error) {
    if (error.code === "23505") {
      if (error.constraint === "unique_email") {
        console.log("Email already taken");
        return res.status(400).json({ error: "Email already taken" });
      } else if (error.constraint === "unique_username") {
        console.log("Username already taken");
        return res.status(400).json({ error: "Username already taken" });
      }
    }
    console.error("Error saving user:", error);
    res.status(500).send("Error saving user to the database");
  }
});

router.post("/verify-token", authenticateUser, (req, res) => {
  res.status(200).json({ message: "Token is valid", user: req.user });
});

module.exports = router;
