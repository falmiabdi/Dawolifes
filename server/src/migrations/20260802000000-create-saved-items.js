'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('saved_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      itemType: {
        type: Sequelize.ENUM('property', 'vehicle'),
        allowNull: false,
      },
      itemId: {
        type: Sequelize.UUID,
        allowNull: false,
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

    await queryInterface.addIndex('saved_items', ['userId']);
    await queryInterface.addIndex('saved_items', ['itemType']);
    await queryInterface.addIndex('saved_items', ['itemId']);
    await queryInterface.addIndex('saved_items', ['userId', 'itemType', 'itemId'], {
      unique: true,
      name: 'saved_items_user_item_unique',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('saved_items');
  },
};
