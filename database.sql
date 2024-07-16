-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR NOT NULL,
  role_id INTEGER,
  email VARCHAR NOT NULL,
  password VARCHAR NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- Roles Table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR NOT NULL
);

-- Restaurants Table
CREATE TABLE restaurant (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  image_url VARCHAR,
  owner_id INTEGER NOT NULL,
  location GEOGRAPHY(Point, 4326),
  address VARCHAR NOT NULL,
  work_start TIME,
  work_end TIME,
  menu_id INTEGER,
  rating INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users (id)
);

-- Menu Table
CREATE TABLE menu (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurant (id),
  FOREIGN KEY (item_id) REFERENCES menu_items (id)
);

-- Menu Items Table
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  name VARCHAR NOT NULL,
  price INTEGER,
  descr TEXT,
  rating INTEGER
);

-- Taxi Table
CREATE TABLE taxi (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL,
  rating INTEGER,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
);

-- Vehicles Table
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  matricule VARCHAR NOT NULL
);

-- Vehicle Ownership Table
CREATE TABLE vehicle_ownership (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL,
  owner_type VARCHAR NOT NULL CHECK (owner_type IN ('user', 'agency')),
  owner_id INTEGER NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
);

-- Car Rental Agencies Table
CREATE TABLE car_rental_agencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  location VARCHAR NOT NULL,
  image_url VARCHAR
);

-- Car Rental Table
CREATE TABLE car_rental (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL,
  agency_id INTEGER NOT NULL,
  rental_date DATE,
  return_date DATE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
  FOREIGN KEY (agency_id) REFERENCES car_rental_agencies (id)
);

-- Car Ride Table
CREATE TABLE car_ride (
  id SERIAL PRIMARY KEY,
  taxi_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  price INTEGER,
  distance INTEGER,
  ride_start GEOGRAPHY(Point, 4326),
  ride_end GEOGRAPHY(Point, 4326),
  FOREIGN KEY (taxi_id) REFERENCES taxi (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Hotels Table
CREATE TABLE hotels (
  id SERIAL PRIMARY KEY,
  image_url VARCHAR,
  name VARCHAR NOT NULL,
  owner_id INTEGER NOT NULL,
  location GEOGRAPHY(Point, 4326),
  work_start TIME,
  work_end TIME,
  address VARCHAR NOT NULL,
  rating INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users (id)
);

-- Hotel Rooms Table
CREATE TABLE hotel_rooms (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL,
  number INTEGER,
  capacity INTEGER,
  price INTEGER,
  FOREIGN KEY (hotel_id) REFERENCES hotels (id)
);

-- Hotel Booking Table
CREATE TABLE hotel_booking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  hotel_id INTEGER NOT NULL,
  person_number INTEGER,
  room_id INTEGER NOT NULL,
  total_price INTEGER,
  booking_start DATE,
  booking_end DATE,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (hotel_id) REFERENCES hotels (id),
  FOREIGN KEY (room_id) REFERENCES hotel_rooms (id)
);

-- Services Table
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  service_name TEXT NOT NULL
);

-- Hotel Services Table
CREATE TABLE hotel_services (
  hotel_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels (id),
  FOREIGN KEY (service_id) REFERENCES services (id)
);

-- Places Table
CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  location GEOGRAPHY(Point, 4326)
);

-- Relationships
ALTER TABLE restaurant
  ADD FOREIGN KEY (menu_id) REFERENCES menu (id);

-- Triggers for conditional foreign key enforcement

-- Trigger Function
CREATE OR REPLACE FUNCTION enforce_owner_fk()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_type = 'user' THEN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.owner_id) THEN
      RAISE EXCEPTION 'Invalid user_id: %', NEW.owner_id;
    END IF;
  ELSIF NEW.owner_type = 'agency' THEN
    IF NOT EXISTS (SELECT 1 FROM car_rental_agencies WHERE id = NEW.owner_id) THEN
      RAISE EXCEPTION 'Invalid agency_id: %', NEW.owner_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid owner_type: %', NEW.owner_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger Definition
CREATE TRIGGER check_owner_fk
BEFORE INSERT OR UPDATE ON vehicle_ownership
FOR EACH ROW EXECUTE FUNCTION enforce_owner_fk();
