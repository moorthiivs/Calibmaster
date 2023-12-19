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

      standard_maintained: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      name_of_equipment: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      uid: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      type_of_facility: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      make: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      model_type: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      year_Of_make: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      serial_no: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      asset_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      receipt_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      date_placed_in_service: {
        type: Sequelize.DATE,
        allowNull: false
      },
      range: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      least_Count: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      least_product_tolerance: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      accuracy: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      history_card_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      date_of_last_calibration_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      calibration_certificate_no: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      calibration_frequency: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      calibration_valid_upto: {
        type: Sequelize.DATE,
        allowNull: false
      },
      calibration_agency: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      calibrated_by: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      equipment_status: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      traceability: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      next_calibration_reminder: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      remark: {
        type: Sequelize.STRING(1000),
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