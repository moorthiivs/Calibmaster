'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Users');
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    if (!tableInfo?.companyId) {
      await queryInterface.addColumn("Users", "companyId", {
        type: Sequelize.INTEGER,
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

    await queryInterface.removeColumn("Users", "companyId");

  }
};
