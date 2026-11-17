'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quotation_generations', {
      quotation_detail_id: {
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
      quotation_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_company_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_Contact_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      customer_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quotation_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      quotation_items: {
        type: Sequelize.ARRAY(Sequelize.JSON),
        allowNull: false
      },
      other_charges: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('quotation_generations');
  }
};