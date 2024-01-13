'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cmssettings', {
      cmssetting_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      setting_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },

      setting_lable: {
        type: Sequelize.STRING(200),
        allowNull: true
      },

      setting_description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },

      setting_value: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: 'NO'
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