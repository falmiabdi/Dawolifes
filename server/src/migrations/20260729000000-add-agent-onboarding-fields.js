'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'profile', {
      type: Sequelize.JSONB,
      defaultValue: {},
    });
    await queryInterface.addColumn('users', 'emailVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('users', 'verificationToken', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('users', 'onboardingComplete', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'profile');
    await queryInterface.removeColumn('users', 'emailVerified');
    await queryInterface.removeColumn('users', 'verificationToken');
    await queryInterface.removeColumn('users', 'onboardingComplete');
  },
};
