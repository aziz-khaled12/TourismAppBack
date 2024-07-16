const express = require('express')
const cors = require('cors')
require('dotenv').config();
const pool = require('./db')
const userRouter = require("./routes/users")
const authRouter = require("./routes/auth")

const app = express()

//Middleware
app.use(cors())
app.use(express.json());
//Routes
app.use('/users', userRouter)
app.use('/auth', authRouter)

app.listen(3000)