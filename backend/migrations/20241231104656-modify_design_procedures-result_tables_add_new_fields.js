'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('design_procedures');
    const table2Info = await queryInterface.describeTable('result_tables');
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    if (!tableInfo.conditional_formats) {
      await queryInterface.addColumn("design_procedures", "conditional_formats", {
        type: Sequelize.DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      });
    }
    if (!table2Info.conditional_formats) {
      await queryInterface.addColumn("result_tables", "conditional_formats", {
        type: Sequelize.DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
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
    await queryInterface.removeColumn("design_procedures", "conditional_formats");
    await queryInterface.removeColumn("result_tables", "conditional_formats");
  }
};
