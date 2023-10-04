'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('srfitems', {

      srf_item_id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },

      srf_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "srves",
          key: "srf_id"
        }
      },

      srf_item_no: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      make: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      model: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      serial_no: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },

      identification_details: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      remarks: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },

      calibration_done_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      calibration_done_by_empname: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },

      dispatch_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      dispatch_dc: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      dispatch_mode: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      report_done_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      report_done_by_empname: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      report_dispatch_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      report_dispatch_mode: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      invoice_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      calibration_remainder_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      rstatus: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Labs",
          key: "lab_id"
        }
      },
      intrument_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "instrument_types",
          key: "instrument_type_id"
        }
      },

      certificate_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      certificate_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      condition_of_item: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },

      url_number: {
        type: Sequelize.STRING(20),
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
        allowNull: false
      },
      updated_by_user_id: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('srfitems');
  }
};