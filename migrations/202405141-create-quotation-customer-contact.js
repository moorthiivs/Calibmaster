'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quotation_customer_contacts', {
      quotation_customer_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      quotation_detail_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "quotation_generations",
          key: "quotation_detail_id"
        }
      },
      customer_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_company_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_address_1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_address_2: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_address_3: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_state: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_pincode: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_Contact_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_email: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('quotation_customer_contacts');
  }
};