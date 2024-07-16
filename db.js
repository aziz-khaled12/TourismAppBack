const Pool = require('pg').Pool

const pool = new Pool({
    user: "postgres",
    password: "aziz",
    host: "localhost",
    port: 5432,
    database: "TourismApp"
})

module.exports = pool