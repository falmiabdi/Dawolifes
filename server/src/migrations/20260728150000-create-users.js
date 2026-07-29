'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('admin', 'agent', 'user'),
        defaultValue: 'user',
      },
      roles: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected', 'Suspended'),
        defaultValue: 'Pending',
      },
      rejectionReason: {
        type: Sequelize.STRING,
      },
      isRootAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      profilePhoto: {
        type: Sequelize.STRING,
      },
      phone: {
        type: Sequelize.STRING,
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      education: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      professionalInfo: {
        type: Sequelize.JSONB,
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  },
};
