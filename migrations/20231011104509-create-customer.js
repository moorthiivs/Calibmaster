'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customers',
      {
        customer_id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        customer_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        customer_code: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        address1: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        address2: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        address3: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        city: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        state: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        country: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        pincode: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        rstatus: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        gst_number: {
          type: Sequelize.STRING,
          allowNull: true,
        },

        labId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Labs",
            key: "lab_id"
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
          allowNull: true
        },
        updated_by_user_id: {
          type: Sequelize.STRING,
          allowNull: true
        }
      });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('customers');
  }
};