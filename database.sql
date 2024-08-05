-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Roles Table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR NOT NULL
);

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR NOT NULL,
  role_id INTEGER,
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- Car Rental Agencies Table
CREATE TABLE car_rental_agencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  location VARCHAR NOT NULL,
  image_url VARCHAR
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

-- Trigger Function for conditional foreign key enforcement
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

-- Restaurants Table
CREATE TABLE restaurant (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  image_url VARCHAR,
  owner_id INTEGER NOT NULL,
  lon FLOAT,
  lat FLOAT,
  road VARCHAR,
  city VARCHAR,
  state VARCHAR,
  country VARCHAR,
  work_start TIME,
  work_end TIME,
  menu_id INTEGER,
  rating INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users (id)
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

-- Menu Table
CREATE TABLE menu (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  FOREIGN KEY (restaurant_id) REFERENCES restaurant (id),
  FOREIGN KEY (item_id) REFERENCES menu_items (id)
);

-- Taxi Table
CREATE TABLE taxi (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL,
  rating INTEGER,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)
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
  ride_start VARCHAR,
  ride_end VARCHAR,
  start_lon FLOAT,
  start_lat FLOAT,
  end_lon FLOAT,
  end_lat FLOAT,
  FOREIGN KEY (taxi_id) REFERENCES taxi (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Hotels Table
CREATE TABLE hotels (
  id SERIAL PRIMARY KEY,
  image_url VARCHAR,
  name VARCHAR NOT NULL,
  owner_id INTEGER NOT NULL,
  lon FLOAT,
  lat FLOAT,
  work_start TIME,
  work_end TIME,
  road VARCHAR,
  city VARCHAR,
  state VARCHAR,
  country VARCHAR,
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
  lat VARCHAR,
  lon VARCHAR,
);

-- Add foreign key to restaurant table for menu_id
ALTER TABLE restaurant
  ADD FOREIGN KEY (menu_id) REFERENCES menu (id);

-- Insert roles into the roles table
INSERT INTO roles (role_name) VALUES ('User');
INSERT INTO roles (role_name) VALUES ('Hotel');
INSERT INTO roles (role_name) VALUES ('Agency');
INSERT INTO roles (role_name) VALUES ('Taxi');
INSERT INTO roles (role_name) VALUES ('Restaurant');
