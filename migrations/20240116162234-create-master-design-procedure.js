'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_design_procedures', {

      master_design_procedure_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Labs",
          key: "lab_id"
        }
      },

      instrument_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "instrument_types",
          key: "instrument_type_id"
        }
      },

      calibration_procedure: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ref_std: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      calibration: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      validity: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      traceability: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      temperature: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      humidity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      atmospheric_pressure: {
        type: Sequelize.STRING,
        allowNull: true,
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
    await queryInterface.dropTable('master_design_procedures');
  }
};