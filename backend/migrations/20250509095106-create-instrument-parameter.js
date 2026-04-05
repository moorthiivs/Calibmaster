'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('InstrumentParameters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      InstrumentID: {
        type: Sequelize.INTEGER
      },
      Instrumentparametername: {
        type: Sequelize.STRING
      },
      InstrumentparameterUOM: {
        type: Sequelize.STRING
      },
      InstrumentUOMID: {
        type: Sequelize.INTEGER
      },
      labid: {
        type: Sequelize.INTEGER
      },
      CreatedBy: {
        type: Sequelize.STRING
      },
      UpdatedBy: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('InstrumentParameters');
  }
};