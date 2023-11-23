'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MasterListEquipments', {
      master_list_equipment_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      asset_identification_no: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      equipment_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      equipment_make_or_nodel: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      equipment_serial_no: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      range_size: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      least_count: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accuracy_or_acceptance: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      year_of_purchase: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      calibrated_by: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      date_of_calibration: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      calibration_due_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      calibration_certificate_no: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      uncertainty: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      frequency_of_calibration: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      created_timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_by_login_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      updated_timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_by_login_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      updated_by_user_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MasterListEquipments');
  }
};