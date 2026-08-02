CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'agent', 'user');
CREATE TYPE user_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Suspended');
CREATE TYPE property_listing_type AS ENUM ('For Sale', 'For Rent');
CREATE TYPE property_status AS ENUM ('Draft', 'Pending', 'Approved', 'Rejected', 'Sold', 'Rented');
CREATE TYPE vehicle_listing_type AS ENUM ('For Sale', 'For Rent', 'Both');
CREATE TYPE vehicle_status AS ENUM ('Draft', 'Pending', 'Approved', 'Rejected', 'Sold', 'Rented');
CREATE TYPE payment_status AS ENUM ('Pending', 'Completed', 'Failed', 'Refunded', 'Expired');
CREATE TYPE payment_method AS ENUM ('chapa', 'telebirr');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  role user_role DEFAULT 'user',
  roles JSONB DEFAULT '[]',
  status user_status DEFAULT 'Pending',
  rejectionReason VARCHAR,
  isRootAdmin BOOLEAN DEFAULT FALSE,
  profilePhoto VARCHAR,
  phone VARCHAR,
  documents JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  professionalInfo JSONB,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  type VARCHAR NOT NULL,
  listingType property_listing_type NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  priceType VARCHAR NOT NULL,
  region VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  subCity VARCHAR,
  woreda VARCHAR,
  kebele VARCHAR,
  parcel VARCHAR,
  block VARCHAR,
  homeNo VARCHAR,
  area DOUBLE PRECISION,
  bedrooms INTEGER,
  bathrooms INTEGER,
  condition VARCHAR,
  legalizedYear INTEGER,
  description TEXT,
  features JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  videoUrl VARCHAR,
  featured BOOLEAN DEFAULT FALSE,
  locationDocument VARCHAR,
  posterType VARCHAR,
  ownerType VARCHAR,
  agentId UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  agentName VARCHAR NOT NULL,
  status property_status DEFAULT 'Draft',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  vehicleId VARCHAR NOT NULL UNIQUE,
  listingType vehicle_listing_type NOT NULL,
  vehicleCategory VARCHAR NOT NULL,
  make VARCHAR NOT NULL,
  vehicleModel VARCHAR NOT NULL,
  trimVersion VARCHAR,
  manufacturingYear INTEGER NOT NULL,
  registrationYear INTEGER,
  vin VARCHAR,
  engineNumber VARCHAR,
  plateNumber VARCHAR,
  color VARCHAR NOT NULL,
  countryOfOrigin VARCHAR NOT NULL,
  fuelType VARCHAR,
  engineSize DOUBLE PRECISION,
  horsepower DOUBLE PRECISION,
  transmission VARCHAR,
  drivetrain VARCHAR,
  cylinders INTEGER,
  seatingCapacity INTEGER,
  doors INTEGER,
  mileage DOUBLE PRECISION,
  fuelConsumption VARCHAR,
  fuelTankCapacity DOUBLE PRECISION,
  groundClearance DOUBLE PRECISION,
  weight DOUBLE PRECISION,
  tireSize VARCHAR,
  condition VARCHAR NOT NULL,
  accidentFree BOOLEAN,
  accidentHistory TEXT,
  serviceHistoryAvailable BOOLEAN,
  ownershipCount INTEGER,
  imported BOOLEAN,
  locallyAssembled BOOLEAN,
  safetyFeatures JSONB DEFAULT '[]',
  interiorFeatures JSONB DEFAULT '[]',
  exteriorFeatures JSONB DEFAULT '[]',
  dailyRate DOUBLE PRECISION,
  weeklyRate DOUBLE PRECISION,
  monthlyRate DOUBLE PRECISION,
  securityDeposit DOUBLE PRECISION,
  minRentalDays INTEGER,
  maxRentalDays INTEGER,
  driverIncluded BOOLEAN,
  selfDrive BOOLEAN,
  fuelPolicy VARCHAR,
  mileageLimit INTEGER,
  extraKmCharge DOUBLE PRECISION,
  deliveryAvailable BOOLEAN,
  airportPickup BOOLEAN,
  availableLocations JSONB,
  availableDates VARCHAR,
  driverAgeRequirement INTEGER,
  minDrivingExperience INTEGER,
  drivingLicenseRequired VARCHAR,
  passportRequired BOOLEAN,
  smokingAllowed BOOLEAN,
  petsAllowed BOOLEAN,
  offroadAllowed BOOLEAN,
  crossborderAllowed BOOLEAN,
  insuranceIncluded BOOLEAN,
  damageLiability VARCHAR,
  sellingPrice DOUBLE PRECISION,
  negotiable BOOLEAN,
  financingAvailable BOOLEAN,
  exchangeAccepted BOOLEAN,
  bankLoanAccepted BOOLEAN,
  regionRegistration VARCHAR,
  ownershipCertificate BOOLEAN,
  roadFundPaid BOOLEAN,
  insuranceValid BOOLEAN,
  inspectionCertificate BOOLEAN,
  customsClearance BOOLEAN,
  dutyPaid BOOLEAN,
  plateType VARCHAR,
  region VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  subCity VARCHAR,
  woreda VARCHAR,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  pickupAddress VARCHAR,
  description TEXT,
  images JSONB DEFAULT '[]',
  videoUrl VARCHAR,
  price DOUBLE PRECISION NOT NULL,
  priceType VARCHAR NOT NULL,
  features JSONB DEFAULT '[]',
  featured BOOLEAN DEFAULT FALSE,
  agentId UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  agentName VARCHAR NOT NULL,
  status vehicle_status DEFAULT 'Draft',
  views INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orderId VARCHAR NOT NULL UNIQUE,
  merchOrderId VARCHAR NOT NULL,
  txRef VARCHAR NOT NULL,
  status payment_status DEFAULT 'Pending',
  amount DOUBLE PRECISION NOT NULL,
  currency VARCHAR DEFAULT 'ETB',
  method payment_method NOT NULL,
  paymentType VARCHAR NOT NULL,
  buyerName VARCHAR NOT NULL,
  buyerEmail VARCHAR NOT NULL,
  buyerPhone VARCHAR NOT NULL,
  propertyId VARCHAR,
  propertyTitle VARCHAR,
  notificationData JSONB,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  propertyId VARCHAR NOT NULL,
  senderId UUID NOT NULL,
  senderName VARCHAR NOT NULL,
  senderRole VARCHAR NOT NULL,
  recipientId UUID NOT NULL,
  recipientName VARCHAR NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  itemType VARCHAR NOT NULL,
  itemId UUID NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,
  CONSTRAINT saved_items_user_item_unique UNIQUE (userId, itemType, itemId)
);

CREATE INDEX IF NOT EXISTS idx_properties_agentId ON properties(agentId);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_createdAt ON properties(createdAt);
CREATE INDEX IF NOT EXISTS idx_vehicles_agentId ON vehicles(agentId);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_createdAt ON vehicles(createdAt);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicleId ON vehicles(vehicleId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_createdAt ON payments(createdAt);
CREATE INDEX IF NOT EXISTS idx_messages_propertyId ON messages(propertyId);
CREATE INDEX IF NOT EXISTS idx_messages_senderId ON messages(senderId);
CREATE INDEX IF NOT EXISTS idx_messages_recipientId ON messages(recipientId);
CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt);
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt);
CREATE INDEX IF NOT EXISTS idx_saved_items_userId ON saved_items(userId);
CREATE INDEX IF NOT EXISTS idx_saved_items_itemType ON saved_items(itemType);
CREATE INDEX IF NOT EXISTS idx_saved_items_itemId ON saved_items(itemId);

SELECT 'Schema created successfully' AS result;
