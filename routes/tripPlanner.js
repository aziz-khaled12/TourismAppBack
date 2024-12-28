const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlewares/authMiddleware");
const tripPlanner = require("../helpers/TripPlanner");
const fetchVenues = require("../helpers/fetchVenues");


const validateTripInput = (req, res, next) => {
    const { userLocation, input } = req.body;
    
    if (!input || typeof input !== 'string') {
        return res.status(400).json({ error: `Valid input text is required the current type is ${typeof input}` });
    }
    
    if (!userLocation || !userLocation.lat || !userLocation.lon ||
        typeof userLocation.lat !== 'number' || typeof userLocation.lon !== 'number') {
        return res.status(400).json({ error: "Valid user location is required" });
    }
    
    next();
};


// Trip planner endpoint
router.post("/", validateTripInput, async (req, res) => {
    try {
        const { userLocation, input } = req.body; // userLocation = { lat, lon }

        // Parse user input using TripPlannerNLP
        const parsedInput = tripPlanner.parseInput(input);

        // Fetch venues from the database based on NLP results
        const venues = await fetchVenues(parsedInput, userLocation);

        res.json({
            itinerary: parsedInput,
            venues
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to plan trip" });
    }
});


module.exports = router;