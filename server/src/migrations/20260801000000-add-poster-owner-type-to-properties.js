'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('properties', 'posterType', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('properties', 'ownerType', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('properties', 'ownerType');
    await queryInterface.removeColumn('properties', 'posterType');
  },
};
