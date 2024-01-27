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

      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Labs",
          key: "lab_id"
        }
      },

      employee_title: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      employee_full_name: {
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