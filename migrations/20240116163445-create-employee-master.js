'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_masters', {
      employee_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      employee_title: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      employee_full: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      employee_role: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      employee_signature: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      employee_enable: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('employee_masters');
  }
};