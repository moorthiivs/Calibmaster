'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('InstrumentVariantsTypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      instrumentVariantsType: {
        type: Sequelize.STRING
      },
      createdBy: {
        type: Sequelize.INTEGER
      },
      updatedBy: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      labid:{
        type: Sequelize.INTEGER,
        allowNull: true, 
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('InstrumentVariantsTypes');
  }
};