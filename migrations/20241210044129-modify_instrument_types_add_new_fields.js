'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('instrument_types');
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('instrument_types', { id: Sequelize.STRING });
     */
    if (!tableInfo?.type) {
      await queryInterface.addColumn("instrument_types", "type", {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('instrument_types');
     */

    await queryInterface.removeColumn("instrument_types", "type");

  }
};
