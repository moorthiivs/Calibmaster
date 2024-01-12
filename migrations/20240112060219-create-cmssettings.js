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

      setting_certificate_name: {
        type: Sequelize.STRING(200),
        allowNull: true,
        defaultValue: 'ENABLE_CERTIFICATE_GENERATION'
      },

      setting_certificate_lable: {
        type: Sequelize.STRING(200),
        allowNull: true,
        defaultValue: 'Enable Certificate Generation'
      },

      setting_certificate_description: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: 'This setting is used display'
      },

      setting_certificate_value: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: 'NO'
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
    await queryInterface.dropTable('cmssettings');
  }
};