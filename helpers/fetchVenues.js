const pool = require("../db");

const fetchVenues = async (parsedInput, userLocation) => {
    const { venues, exclusions } = parsedInput;
    const results = [];

    for (const venue of venues) {
        // Skip excluded venues
        if (exclusions.some(ex => ex.type === venue.type)) continue;

        let query = "";
        let params = [userLocation.lon, userLocation.lat];

        // Define query based on venue type
        switch (venue.type) {
            case "hotel":
                query = `
                    SELECT id, name, lon, lat, image_url, rating, description 
                    FROM hotels
                    WHERE state ILIKE $3
                    ORDER BY ST_Distance(location, ST_MakePoint($1, $2)::geography) LIMIT 1;
                `;
                params.push(parsedInput?.state || "%");
                break;

            case "restaurant":
                query = `
                    SELECT id, name, lon, lat, image_url, rating 
                    FROM restaurant
                    WHERE state ILIKE $3
                    ORDER BY ST_Distance(location, ST_MakePoint($1, $2)::geography) LIMIT 1;
                `;
                params.push(parsedInput?.state || "%");
                break;

            case "attraction":
                query = `
                    SELECT id, name, lon, lat, image_url, rating 
                    FROM places
                    WHERE state ILIKE $3
                    ORDER BY ST_Distance(location, ST_MakePoint($1, $2)::geography) LIMIT 1;
                `;
                params.push(parsedInput?.state || "%");
                break;
        }

        // Execute query and add to results
        if (query) {
            const { rows } = await pool.query(query, params);
            results.push(...rows);
        }
    }

    return results;
};

module.exports = fetchVenues;
