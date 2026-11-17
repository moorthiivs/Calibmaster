'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cmssettings', {

      cmssetting_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      setting_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },

      setting_lable: {
        type: Sequelize.STRING(200),
        allowNull: false
      },

      setting_description: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      setting_value: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cmssettings');
  }
};