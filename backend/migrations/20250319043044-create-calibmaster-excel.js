'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CalibmasterExcels', {
      cmeid: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      FileName: {
        type: Sequelize.STRING
      },
      FileLocation: {
        type: Sequelize.STRING
      },
      ExcelData: {
        type: Sequelize.JSON
      },
      createdby: {
        type: Sequelize.INTEGER
      },
      updatedby: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('CalibmasterExcels');
  }
};