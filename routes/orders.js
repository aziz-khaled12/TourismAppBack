const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateUser = require("../middlewares/authMiddleware");
const path = require("path");
const admin = require("firebase-admin");
const multer = require("multer");


router.post("/", authenticateUser, async (req, res) => {
    const {} = req.body
  })
router.get("/", authenticateUser, async (req, res) => {
    const {} = req.body
  })
router.get("/:id", authenticateUser, async (req, res) => {
    const {} = req.body
  })

  module.exports = router;
