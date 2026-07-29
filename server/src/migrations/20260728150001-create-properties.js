'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('properties', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      listingType: {
        type: Sequelize.ENUM('For Sale', 'For Rent'),
        allowNull: false,
      },
      price: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      priceType: {
        type: Sequelize.STRING,
        allowNull: false,
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
      kebele: {
        type: Sequelize.STRING,
      },
      parcel: {
        type: Sequelize.STRING,
      },
      block: {
        type: Sequelize.STRING,
      },
      homeNo: {
        type: Sequelize.STRING,
      },
      area: {
        type: Sequelize.DOUBLE,
      },
      bedrooms: {
        type: Sequelize.INTEGER,
      },
      bathrooms: {
        type: Sequelize.INTEGER,
      },
      condition: {
        type: Sequelize.STRING,
      },
      legalizedYear: {
        type: Sequelize.INTEGER,
      },
      description: {
        type: Sequelize.TEXT,
      },
      features: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      images: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      videoUrl: {
        type: Sequelize.STRING,
      },
      featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      locationDocument: {
        type: Sequelize.STRING,
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
      latitude: {
        type: Sequelize.DOUBLE,
      },
      longitude: {
        type: Sequelize.DOUBLE,
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

    await queryInterface.addIndex('properties', ['agentId']);
    await queryInterface.addIndex('properties', ['status']);
    await queryInterface.addIndex('properties', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('properties');
  },
};
