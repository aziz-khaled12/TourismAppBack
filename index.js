const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import routes
const userRouter = require("./routes/users");
const tripPlanner = require("./routes/tripPlanner");
const authRouter = require("./routes/auth");
const hotelsRouter = require("./routes/hotels");
const testRouter = require("./routes/test");
const restaurantsRouter = require("./routes/restaurants");
const locationsRouter = require("./routes/locations");
const ordersRouter = require("./routes/orders");
const addRouter = require("./routes/add");
const interactionsRouter = require("./routes/interactions");
const menuRouter = require("./routes/menu");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/add", addRouter);
app.use("/hotels", hotelsRouter);
app.use("/restaurants", restaurantsRouter);
app.use("/locations", locationsRouter);
app.use("/interactions", interactionsRouter);
app.use("/test", testRouter);
app.use("/planner", tripPlanner);
app.use("/restaurants/menu", menuRouter);
app.use("/restaurants/orders", ordersRouter);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// Start server function
app.listen(3000, () => {
  console.log("Server started on port 3000");
})

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

module.exports = app;