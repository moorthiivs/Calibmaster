'use strict';

const { sequelize } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quotation_configs', {
      quotation_config_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Labs",
          key: "lab_id"
        }
      },
      GST_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      PAN_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Bank_account_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      Bank_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      branch: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      IFSC_code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      HSN_SAC: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Lab_Short_Name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Quotation_Short_Name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Current_Financial_Year: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Running_Quotation_Number: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      GST_Percentage: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      Actual_Running_Quotation_Number: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('quotation_configs');
  }
};