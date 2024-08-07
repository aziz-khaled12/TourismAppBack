

const fetchHotels = async () => {
    const HOTELS_FILE = path.join(__dirname, './data/hotels.json');
  
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `
        [out:json];
        area["ISO3166-1"="DZ"][admin_level=2];
        node["tourism"="hotel"](area);
        out body;
      `,
    });
    const data = await response.json();
    console.log(data);
  
    const hotelCoordinates = data.elements.map((hotel) => ({
      name: hotel.tags.name,
      id: hotel.id,
      lat: hotel.lat,
      lon: hotel.lon,
    }));
  
    const hotelsWithAddresses = [];
  
    for (const hotel of hotelCoordinates) {
      try {
        const addressUrl = `https://nominatim.openstreetmap.org/reverse?lat=${hotel.lat}&lon=${hotel.lon}&format=json`;
        const addressResponse = await fetch(addressUrl);
        if (!addressResponse.ok) {
          throw new Error(`Failed to fetch address for hotel ID: ${hotel.id}`);
        }
        const addressData = await addressResponse.json();
        console.log("addressData: ", addressData);
  
        hotelsWithAddresses.push({
          ...hotel,
          address: addressData.address || "Address not available",
        });
      } catch (error) {
        console.error("Error fetching address:", error);
        hotelsWithAddresses.push({
          ...hotel,
          address: "Address not available",
        });
      }
    }
  
    fs.writeFileSync(HOTELS_FILE, JSON.stringify(hotelsWithAddresses, null, 2));
    console.log('Hotel data saved to', HOTELS_FILE);
    return hotelsWithAddresses;
  };
  
  // Call the function (for testing purposes)
  fetchHotels().then(hotels => {
    console.log('Fetched and saved hotels:', hotels);
  }).catch(error => {
    console.error('Error in fetching hotels:', error);
  });
  




// Function to insert a user
const insertUser = async (username, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const res = await pool.query(
    `INSERT INTO users (username, role_id, email, password) 
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [username, 2, email, hashedPassword]
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




// Function to insert a hotel
const insertHotel = async (hotelData, ownerId) => {
  const randomRating = Math.floor(Math.random() * 5) + 1;

  await pool.query(
    `INSERT INTO hotels (image_url, name, owner_id, lon, lat, work_start, work_end, road, city, state, country, rating) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      null,
      hotelData.name,
      ownerId,
      hotelData.lon,
      hotelData.lat,
      '08:00:00',
      '00:00:00',
      hotelData.address.road,
      hotelData.address.town || hotelData.address.city,
      hotelData.address.state,
      hotelData.address.country,
      randomRating,
    ]
  );
};
// Main function to process the JSON data and insert it into the database
const main = async () => {
  try {
    await pool.connect();
    const hotelsData = loadLocationData('../data/hotels.json')


    for (const hotel of hotelsData) {
      const email = `${hotel.id}@hotel.com`;
      const username = hotel.name.replace(/\s/g, '_').toLowerCase();
      const password = username; // Set a default password

      const ownerId = await insertUser(username, email, password);
      await insertHotel(hotel, ownerId);
    }

    console.log('All hotels have been successfully added to the database.');
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





const fetchAttractions = async () => {
  const ATTRACTIONS_FILE = path.join(__dirname, './data/attractions.json');

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `
      [out:json];
      area["ISO3166-1"="DZ"][admin_level=2];
      node["tourism"="attraction"](area);
      out body;
    `,
  });

  const data = await response.json();
  console.log(data);

  const attractionCoordinates = data.elements.map((attraction) => ({
    name: attraction.tags.name,
    id: attraction.id,
    lat: attraction.lat,
    lon: attraction.lon,
  }));

  const attractionsWithAddresses = [];

  for (const attraction of attractionCoordinates) {
    try {
      const addressUrl = `https://nominatim.openstreetmap.org/reverse?lat=${attraction.lat}&lon=${attraction.lon}&format=json`;
      const addressResponse = await fetch(addressUrl);
      if (!addressResponse.ok) {
        throw new Error(`Failed to fetch address for attraction ID: ${attraction.id}`);
      }
      const addressData = await addressResponse.json();
      console.log("addressData: ", addressData);

      attractionsWithAddresses.push({
        ...attraction,
        address: addressData.address || "Address not available",
      });
    } catch (error) {
      console.error("Error fetching address:", error);
      attractionsWithAddresses.push({
        ...attraction,
        address: "Address not available",
      });
    }
  }

  fs.writeFileSync(ATTRACTIONS_FILE, JSON.stringify(attractionsWithAddresses, null, 2));
  console.log('Attraction data saved to', ATTRACTIONS_FILE);
  return attractionsWithAddresses;
};

// Call the function (for testing purposes)
fetchAttractions().then(attractions => {
  console.log('Fetched and saved attractions:', attractions);
}).catch(error => {
  console.error('Error in fetching attractions:', error);
});
