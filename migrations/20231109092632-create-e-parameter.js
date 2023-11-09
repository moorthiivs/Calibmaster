'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EParameters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      issue_no: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      issue_date: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amend_no: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amend_date: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lab_id: {
        type: Sequelize.STRING,
        allowNull: false,
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
    await queryInterface.dropTable('EParameters');
  }
};