'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('srfitems');
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    if (!tableInfo.reminder_frequency) {
      await queryInterface.addColumn("srfitems", "reminder_frequency", {
          type: Sequelize.DataTypes.STRING,
          allowNull: true,
      });
    }
    if (!tableInfo.frequency_days) {
      await queryInterface.addColumn("srfitems", "frequency_days", {
        type: Sequelize.DataTypes.STRING,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("srfitems", "reminder_frequency");
    await queryInterface.removeColumn("srfitems", "frequency_days");

  }
};
