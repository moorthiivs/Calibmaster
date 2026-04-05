'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instrument_groups', {
      instrument_group_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      instrument_discipline_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "instrument_disciplines",
          key: "instrument_discipline_id",
        },
      },
      group_details: {
        type: Sequelize.STRING,
        allowNull: false
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('instrument_groups');
  }
};