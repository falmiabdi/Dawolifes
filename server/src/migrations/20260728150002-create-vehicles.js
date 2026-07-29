'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('vehicles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      vehicleId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      listingType: {
        type: Sequelize.ENUM('For Sale', 'For Rent', 'Both'),
        allowNull: false,
      },
      vehicleCategory: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      make: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vehicleModel: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      trimVersion: {
        type: Sequelize.STRING,
      },
      manufacturingYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      registrationYear: {
        type: Sequelize.INTEGER,
      },
      vin: {
        type: Sequelize.STRING,
      },
      engineNumber: {
        type: Sequelize.STRING,
      },
      plateNumber: {
        type: Sequelize.STRING,
      },
      color: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      countryOfOrigin: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      fuelType: {
        type: Sequelize.STRING,
      },
      engineSize: {
        type: Sequelize.DOUBLE,
      },
      horsepower: {
        type: Sequelize.DOUBLE,
      },
      transmission: {
        type: Sequelize.STRING,
      },
      drivetrain: {
        type: Sequelize.STRING,
      },
      cylinders: {
        type: Sequelize.INTEGER,
      },
      seatingCapacity: {
        type: Sequelize.INTEGER,
      },
      doors: {
        type: Sequelize.INTEGER,
      },
      mileage: {
        type: Sequelize.DOUBLE,
      },
      fuelConsumption: {
        type: Sequelize.STRING,
      },
      fuelTankCapacity: {
        type: Sequelize.DOUBLE,
      },
      groundClearance: {
        type: Sequelize.DOUBLE,
      },
      weight: {
        type: Sequelize.DOUBLE,
      },
      tireSize: {
        type: Sequelize.STRING,
      },
      condition: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accidentFree: {
        type: Sequelize.BOOLEAN,
      },
      accidentHistory: {
        type: Sequelize.TEXT,
      },
      serviceHistoryAvailable: {
        type: Sequelize.BOOLEAN,
      },
      ownershipCount: {
        type: Sequelize.INTEGER,
      },
      imported: {
        type: Sequelize.BOOLEAN,
      },
      locallyAssembled: {
        type: Sequelize.BOOLEAN,
      },
      safetyFeatures: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      interiorFeatures: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      exteriorFeatures: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      dailyRate: {
        type: Sequelize.DOUBLE,
      },
      weeklyRate: {
        type: Sequelize.DOUBLE,
      },
      monthlyRate: {
        type: Sequelize.DOUBLE,
      },
      securityDeposit: {
        type: Sequelize.DOUBLE,
      },
      minRentalDays: {
        type: Sequelize.INTEGER,
      },
      maxRentalDays: {
        type: Sequelize.INTEGER,
      },
      driverIncluded: {
        type: Sequelize.BOOLEAN,
      },
      selfDrive: {
        type: Sequelize.BOOLEAN,
      },
      fuelPolicy: {
        type: Sequelize.STRING,
      },
      mileageLimit: {
        type: Sequelize.INTEGER,
      },
      extraKmCharge: {
        type: Sequelize.DOUBLE,
      },
      deliveryAvailable: {
        type: Sequelize.BOOLEAN,
      },
      airportPickup: {
        type: Sequelize.BOOLEAN,
      },
      availableLocations: {
        type: Sequelize.JSONB,
      },
      availableDates: {
        type: Sequelize.STRING,
      },
      driverAgeRequirement: {
        type: Sequelize.INTEGER,
      },
      minDrivingExperience: {
        type: Sequelize.INTEGER,
      },
      drivingLicenseRequired: {
        type: Sequelize.STRING,
      },
      passportRequired: {
        type: Sequelize.BOOLEAN,
      },
      smokingAllowed: {
        type: Sequelize.BOOLEAN,
      },
      petsAllowed: {
        type: Sequelize.BOOLEAN,
      },
      offroadAllowed: {
        type: Sequelize.BOOLEAN,
      },
      crossborderAllowed: {
        type: Sequelize.BOOLEAN,
      },
      insuranceIncluded: {
        type: Sequelize.BOOLEAN,
      },
      damageLiability: {
        type: Sequelize.STRING,
      },
      sellingPrice: {
        type: Sequelize.DOUBLE,
      },
      negotiable: {
        type: Sequelize.BOOLEAN,
      },
      financingAvailable: {
        type: Sequelize.BOOLEAN,
      },
      exchangeAccepted: {
        type: Sequelize.BOOLEAN,
      },
      bankLoanAccepted: {
        type: Sequelize.BOOLEAN,
      },
      regionRegistration: {
        type: Sequelize.STRING,
      },
      ownershipCertificate: {
        type: Sequelize.BOOLEAN,
      },
      roadFundPaid: {
        type: Sequelize.BOOLEAN,
      },
      insuranceValid: {
        type: Sequelize.BOOLEAN,
      },
      inspectionCertificate: {
        type: Sequelize.BOOLEAN,
      },
      customsClearance: {
        type: Sequelize.BOOLEAN,
      },
      dutyPaid: {
        type: Sequelize.BOOLEAN,
      },
      plateType: {
        type: Sequelize.STRING,
      },
      region: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      subCity: {
        type: Sequelize.STRING,
      },
      woreda: {
        type: Sequelize.STRING,
      },
      latitude: {
        type: Sequelize.DOUBLE,
      },
      longitude: {
        type: Sequelize.DOUBLE,
      },
      pickupAddress: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      images: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      videoUrl: {
        type: Sequelize.STRING,
      },
      price: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      priceType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      features: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      agentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      agentName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Pending', 'Approved', 'Rejected', 'Sold', 'Rented'),
        defaultValue: 'Draft',
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      favorites: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('vehicles', ['agentId']);
    await queryInterface.addIndex('vehicles', ['status']);
    await queryInterface.addIndex('vehicles', ['createdAt']);
    await queryInterface.addIndex('vehicles', ['vehicleId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('vehicles');
  },
};
