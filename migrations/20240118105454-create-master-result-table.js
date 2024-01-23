'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_result_tables', {
      master_result_table_id: {
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

      master_design_procedure_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "master_design_procedures",
          key: "master_design_procedure_id"
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

      srf_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "srf_lists",
          key: "srf_id"
        }
      },

      srf_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "srfitems",
          key: "srf_item_id"
        }
      },

      unique_id: {
        type: Sequelize.STRING,
        allowNull: false,
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

      ulr_number: {
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
    await queryInterface.dropTable('master_result_tables');
  }
};