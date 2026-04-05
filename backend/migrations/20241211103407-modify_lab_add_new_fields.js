'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Labs');
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('Labs', { id: Sequelize.STRING });
     */
    if (!tableInfo?.nabl_logo_filename) {
      await queryInterface.addColumn("Labs", "nabl_logo_filename", {
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
     * await queryInterface.dropTable('Labs');
     */

    await queryInterface.removeColumn("Labs", "nabl_logo_filename");

  }
};
