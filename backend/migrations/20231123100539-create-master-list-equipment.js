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

      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Labs",
          key: "lab_id"
        }
      },

      instrument_discipline_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "instrument_disciplines",
          key: "instrument_discipline_id",
        },
      },

      instrument_group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "instrument_groups",
          key: "instrument_group_id",
        },
      },

      standard_maintained: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      name_of_equipment: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      uid: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      type_of_facility: {
        type: Sequelize.STRING(200),
        allowNull: true,
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
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      serial_no: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      asset_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
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
        allowNull: true,
      },
      least_Count: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      least_product_tolerance: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      accuracy: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      history_card_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true,
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
        allowNull: true,
      },
      calibration_agency: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      calibrated_by: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      equipment_status: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      traceability: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      next_calibration_reminder: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      calibration_valid_upto: {
        type: Sequelize.DATE,
        allowNull: false
      },
      calibration_remainder_date_1: {
        type: Sequelize.DATE,
        allowNull: true
      },
      calibration_remainder_date_2: {
        type: Sequelize.DATE,
        allowNull: true
      },

      remark: {
        type: Sequelize.STRING(1000),
        allowNull: true,
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