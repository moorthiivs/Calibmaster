'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bank_details', {
      lab_bank_detail_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Labs',
          key: 'lab_id'
        },
      },
      bank_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      account_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      branch: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ifsc_code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bank_details');
  }
};
