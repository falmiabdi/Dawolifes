-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'agent', 'owner', 'user');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Suspended');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('Draft', 'Pending', 'Approved', 'Rejected', 'Sold', 'Rented');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('Draft', 'Pending', 'Approved', 'Rejected', 'Sold', 'Rented');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Completed', 'Failed', 'Refunded', 'Expired');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('chapa', 'telebirr');

-- CreateEnum
CREATE TYPE "SavedItemType" AS ENUM ('property', 'vehicle');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "roles" JSONB NOT NULL DEFAULT '[]',
    "status" "UserStatus" NOT NULL DEFAULT 'Pending',
    "rejectionReason" TEXT,
    "isRootAdmin" BOOLEAN NOT NULL DEFAULT false,
    "profilePhoto" TEXT,
    "phone" TEXT,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "education" JSONB NOT NULL DEFAULT '[]',
    "professionalInfo" JSONB,
    "profile" JSONB NOT NULL DEFAULT '{}',
    "firebaseUid" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMPTZ(3),
    "verificationToken" TEXT,
    "otp" VARCHAR(6),
    "otpExpiresAt" TIMESTAMPTZ(3),
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'android',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "type" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceType" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "subCity" TEXT,
    "woreda" TEXT,
    "kebele" TEXT,
    "parcel" TEXT,
    "block" TEXT,
    "floorNumber" TEXT,
    "houseNumber" TEXT,
    "area" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "condition" TEXT,
    "legalizedYear" INTEGER,
    "description" TEXT,
    "features" JSONB NOT NULL DEFAULT '[]',
    "images" JSONB NOT NULL DEFAULT '[]',
    "videoUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "locationDocument" TEXT,
    "posterType" TEXT,
    "ownerType" TEXT,
    "contactMode" TEXT DEFAULT 'Admin',
    "agentId" UUID NOT NULL,
    "agentName" TEXT NOT NULL,
    "displayPhone" TEXT,
    "displayPhoto" TEXT,
    "status" "PropertyStatus" NOT NULL DEFAULT 'Draft',
    "rejectionReason" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "vehicleCategory" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "trimVersion" TEXT,
    "manufacturingYear" INTEGER NOT NULL,
    "registrationYear" INTEGER,
    "vin" TEXT,
    "engineNumber" TEXT,
    "plateNumber" TEXT,
    "color" TEXT NOT NULL,
    "countryOfOrigin" TEXT NOT NULL,
    "fuelType" TEXT,
    "engineSize" DOUBLE PRECISION,
    "horsepower" DOUBLE PRECISION,
    "transmission" TEXT,
    "drivetrain" TEXT,
    "cylinders" INTEGER,
    "seatingCapacity" INTEGER,
    "doors" INTEGER,
    "mileage" DOUBLE PRECISION,
    "fuelConsumption" TEXT,
    "fuelTankCapacity" DOUBLE PRECISION,
    "groundClearance" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "tireSize" TEXT,
    "condition" TEXT NOT NULL,
    "accidentFree" BOOLEAN,
    "accidentHistory" TEXT,
    "serviceHistoryAvailable" BOOLEAN,
    "ownershipCount" INTEGER,
    "imported" BOOLEAN,
    "locallyAssembled" BOOLEAN,
    "safetyFeatures" JSONB NOT NULL DEFAULT '[]',
    "interiorFeatures" JSONB NOT NULL DEFAULT '[]',
    "exteriorFeatures" JSONB NOT NULL DEFAULT '[]',
    "dailyRate" DOUBLE PRECISION,
    "weeklyRate" DOUBLE PRECISION,
    "monthlyRate" DOUBLE PRECISION,
    "securityDeposit" DOUBLE PRECISION,
    "minRentalDays" INTEGER,
    "maxRentalDays" INTEGER,
    "driverIncluded" BOOLEAN,
    "selfDrive" BOOLEAN,
    "fuelPolicy" TEXT,
    "mileageLimit" INTEGER,
    "extraKmCharge" DOUBLE PRECISION,
    "deliveryAvailable" BOOLEAN,
    "airportPickup" BOOLEAN,
    "availableLocations" JSONB,
    "availableDates" TEXT,
    "driverAgeRequirement" INTEGER,
    "minDrivingExperience" INTEGER,
    "drivingLicenseRequired" TEXT,
    "passportRequired" BOOLEAN,
    "smokingAllowed" BOOLEAN,
    "petsAllowed" BOOLEAN,
    "offroadAllowed" BOOLEAN,
    "crossborderAllowed" BOOLEAN,
    "insuranceIncluded" BOOLEAN,
    "damageLiability" TEXT,
    "sellingPrice" DOUBLE PRECISION,
    "negotiable" BOOLEAN,
    "financingAvailable" BOOLEAN,
    "exchangeAccepted" BOOLEAN,
    "bankLoanAccepted" BOOLEAN,
    "regionRegistration" TEXT,
    "ownershipCertificate" BOOLEAN,
    "roadFundPaid" BOOLEAN,
    "insuranceValid" BOOLEAN,
    "inspectionCertificate" BOOLEAN,
    "customsClearance" BOOLEAN,
    "dutyPaid" BOOLEAN,
    "plateType" TEXT,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "subCity" TEXT,
    "woreda" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "pickupAddress" TEXT,
    "description" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "videoUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "priceType" TEXT NOT NULL,
    "features" JSONB NOT NULL DEFAULT '[]',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "agentId" UUID NOT NULL,
    "agentName" TEXT NOT NULL,
    "displayPhone" TEXT,
    "displayPhoto" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'Draft',
    "rejectionReason" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "orderId" TEXT NOT NULL,
    "merchOrderId" TEXT NOT NULL,
    "txRef" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'Pending',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "method" "PaymentMethod" NOT NULL,
    "paymentType" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "propertyId" TEXT,
    "propertyTitle" TEXT,
    "notificationData" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMPTZ(3),
    "data" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "propertyId" TEXT NOT NULL,
    "senderId" UUID NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "recipientId" UUID NOT NULL,
    "recipientName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_items" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "itemType" "SavedItemType" NOT NULL,
    "itemId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "saved_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "contactPhone1" TEXT,
    "contactPhone2" TEXT,
    "contactPhone3" TEXT,
    "contactEmail" TEXT,
    "socialFacebook" TEXT,
    "socialTelegram" TEXT,
    "socialWhatsapp" TEXT,
    "socialTiktok" TEXT,
    "socialLinkedin" TEXT,
    "socialInstagram" TEXT,
    "socialYoutube" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "properties_agentId_idx" ON "properties"("agentId");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_createdAt_idx" ON "properties"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicleId_key" ON "vehicles"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicles_agentId_idx" ON "vehicles"("agentId");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_createdAt_idx" ON "vehicles"("createdAt");

-- CreateIndex
CREATE INDEX "vehicles_vehicleId_idx" ON "vehicles"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_readAt_idx" ON "notifications"("readAt");

-- CreateIndex
CREATE INDEX "messages_propertyId_idx" ON "messages"("propertyId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_recipientId_idx" ON "messages"("recipientId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "announcements_authorId_idx" ON "announcements"("authorId");

-- CreateIndex
CREATE INDEX "announcements_createdAt_idx" ON "announcements"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "saved_items_userId_itemType_itemId_key" ON "saved_items"("userId", "itemType", "itemId");

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

