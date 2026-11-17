"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("EmployeeTrackConfig", {

      configId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      idleTimeoutMinutes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20
      },

      preventConcurrentLogins: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("EmployeeTrackConfig");
  },
};