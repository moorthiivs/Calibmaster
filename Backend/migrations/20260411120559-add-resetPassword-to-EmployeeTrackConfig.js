"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("EmployeeTrackConfig", "resetPassword", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'admin123'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("EmployeeTrackConfig", "resetPassword");
  },
};
