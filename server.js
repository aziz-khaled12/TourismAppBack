const express = require('express')
const cors = require('cors')
require('dotenv').config();
const userRouter = require("./routes/users")
const authRouter = require("./routes/auth")
const hotelsRouter = require("./routes/hotels")
const restaurantsRouter = require("./routes/restaurants")
const locationsRouter = require("./routes/locations")
const fs = require("fs");
const path = require("path");
const pool = require("./db");
const bcrypt = require("bcryptjs");


const app = express()
const port = process.env.PORT || 3000

//Middleware
app.use(cors())
app.use(express.json());

//Routes
app.use('/users', userRouter)
app.use('/auth', authRouter)
app.use('/hotels', hotelsRouter)
app.use('/restaurants', restaurantsRouter)
app.use('/locations', locationsRouter)


app.listen(port)