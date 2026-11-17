"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("EmployeeTrackings", {
      empTrackingId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users", // table name
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      loginAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      logoutAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      totalHours: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "active",
      },

      logoutType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true,
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
    await queryInterface.addIndex("EmployeeTrackings", ["userId"]);
    await queryInterface.addIndex("EmployeeTrackings", ["date"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("EmployeeTrackings");
  },
};