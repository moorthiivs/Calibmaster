"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SRFs", {

      srf_id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },

      srf_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      srf_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      srf_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      contact_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contact_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      department: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      customer_dc: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      customer_dc_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      send_srf_via_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      agreed_completion_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      next_cal_due_require_flag: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: 'No'
      },
      reminder_frequency: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      statement_of_confirmity_flag: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: 'No'
      },
      statement_of_confirmity: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      uncertainity_consider_flag: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },

      issue_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      amend_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amend_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      rstatus: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Labs",
          key: "lab_id"
        }
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Companies",
          key: "id"
        }
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
    await queryInterface.dropTable("SRFs");
  },
};
