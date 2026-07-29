'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      merchOrderId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      txRef: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Completed', 'Failed', 'Refunded', 'Expired'),
        defaultValue: 'Pending',
      },
      amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'ETB',
      },
      method: {
        type: Sequelize.ENUM('chapa', 'telebirr'),
        allowNull: false,
      },
      paymentType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      buyerName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      buyerEmail: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      buyerPhone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      propertyId: {
        type: Sequelize.STRING,
      },
      propertyTitle: {
        type: Sequelize.STRING,
      },
      notificationData: {
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

    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  },
};
