const express = require('express')
const cors = require('cors')
require('dotenv').config();
const userRouter = require("./routes/users")
const authRouter = require("./routes/auth")
const hotelsRouter = require("./routes/hotels")
const testRouter = require("./routes/test")
const restaurantsRouter = require("./routes/restaurants")
const locationsRouter = require("./routes/locations")
const ordersRouter = require("./routes/orders")
const interactionsRouter = require("./routes/interactions")
const menuRouter = require("./routes/menu")
const path = require("path");


const app = express()
const port = 3000

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Middleware
app.use(cors())
app.use(express.json());

//Routes
app.use('/users', userRouter)
app.use('/auth', authRouter)
app.use('/hotels', hotelsRouter)
app.use('/restaurants', restaurantsRouter)
app.use('/locations', locationsRouter)
app.use('/interactions', interactionsRouter)
app.use('/test', testRouter)
app.use('/restaurants/menu', menuRouter)
app.use('/restaurants/orders', ordersRouter)

app.listen(port)