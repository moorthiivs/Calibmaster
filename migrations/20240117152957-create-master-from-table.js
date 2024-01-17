'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_from_tables', {
      master_from_table_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Labs",
          key: "lab_id"
        }
      },

      calibration_procedure: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      ulr_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      validity: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      traceability: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      calibration_procedure: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      temperature: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      humidity: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      atmospheric_pressure: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('master_from_tables');
  }
};