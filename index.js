const express = require('express')
const cors = require('cors')
require('dotenv').config();
const userRouter = require("./routes/users")
const authRouter = require("./routes/auth")
const hotelsRouter = require("./routes/hotels")
const testRouter = require("./routes/test")
const restaurantsRouter = require("./routes/restaurants")
const locationsRouter = require("./routes/locations")
const fs = require("fs");
const path = require("path");
const pool = require("./db");
const bcrypt = require("bcryptjs");


const app = express()
const port = 3000

//Middleware
app.use(cors())
app.use(express.json());

//Routes
app.use('/users', userRouter)
app.use('/auth', authRouter)
app.use('/hotels', hotelsRouter)
app.use('/restaurants', restaurantsRouter)
app.use('/locations', locationsRouter)
app.use('/test', testRouter)



// Function to insert a user
const insertUser = async (username, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const res = await pool.query(
      `INSERT INTO users (username, role_id, email, password) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [username, 5, email, hashedPassword]
    );
    return res.rows[0].id;
  };


// Function to insert a restaurant without a menu
const insertRestaurant = async (restaurantData, ownerId) => {
    const randomRating = Math.floor(Math.random() * 5) + 1;
  
    const res = await pool.query(
      `INSERT INTO restaurant (name, owner_id, lon, lat, work_start, work_end, road, city, state, country, rating, menu_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        restaurantData.name,
        ownerId,
        restaurantData.lon,
        restaurantData.lat,
        '11:00:00',
        '23:00:00',
        restaurantData.address.road,
        restaurantData.address.town || restaurantData.address.city,
        restaurantData.address.state,
        restaurantData.address.country,
        randomRating,
        null  // Initially, menu_id is set to NULL
      ]
    );
    return res.rows[0].id;
  };
  
  // Main function to process the JSON data and insert it into the database
  const main = async () => {
    try {
      await pool.connect();
      const restaurantsData = loadLocationData('./data/restaurants.json')
  
  
      for (const restaurant of restaurantsData) {
        const email = `${restaurant.id}@resto.com`;
        const username = restaurant.name.replace(/\s/g, '_').toLowerCase();
        const password = username; // Set a default password
  
        const ownerId = await insertUser(username, email, password);
        await insertRestaurant(restaurant, ownerId);
      }
  
      console.log('All restaurants have been successfully added to the database.');
    } catch (error) {
      console.error('Error:', error);
    } 
  };
  
  main();
  
  const loadLocationData = (LocationPath) => {
    try {
      const data = fs.readFileSync(LocationPath, "utf8");
      const parsedData = JSON.parse(data);
      const filteredData = parsedData.filter(location => location.hasOwnProperty('name'));
      return filteredData;
    } catch (error) {
      console.error("Error loading location data:", error);
      throw error;
    }
  };
  



app.listen(port)