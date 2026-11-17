'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cmssettings_permissions', {

      cmssetting_permission_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Labs",
          key: "lab_id"
        }
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

      is_enable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable('cmssettings_permissions');
  }
};