'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'refreshToken', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
      comment: 'Hashed refresh token — set on login, cleared on logout'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'refreshToken');
  }
};
