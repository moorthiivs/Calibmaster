'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ULRGenerations', {
      ulr_generation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Labs",
          key: "lab_id"
        }
      },
      accreditationNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      currentYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      location: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      runningNumber: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accreditedScope: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      effectiveStartDate: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      effectiveEndDate: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      effectiveFlag: {
        type: Sequelize.STRING,
        allowNull: false,
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ULRGenerations');
  }
};