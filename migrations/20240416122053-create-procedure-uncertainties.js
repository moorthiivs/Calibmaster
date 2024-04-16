'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('procedure_uncertainties', {
      procedure_uncertainty_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      master_design_procedure_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "master_design_procedures",
          key: "master_design_procedure_id"
        }
      },
      uncertainty_master_parameter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "uncertainty_master_parameters",
          key: "uncertainty_master_parameter_id"
        }
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
    await queryInterface.dropTable('procedure_uncertainties');
  }
};