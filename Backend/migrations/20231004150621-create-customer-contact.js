'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('customer_contacts',
      {
        customer_contact_id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        customer_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "customers",
            key: "customer_id"
          }
        },
        contact_title: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        contact_fullname: {
          type: Sequelize.STRING(500),
          allowNull: false,
        },
        contact_email: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        contact_phone_1: {
          type: Sequelize.STRING(15),
          allowNull: false,
        },
        contact_phone_2: {
          type: Sequelize.STRING(15),
          allowNull: false,
        },
        rstatus: {
          type: Sequelize.INTEGER,
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
        }
      });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('customer_contacts');
  }
};