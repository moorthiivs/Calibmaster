'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('quotation_generations');
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    if (!tableInfo.notes) {
      await queryInterface.addColumn("quotation_generations", "notes", {
        type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.STRING),
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
    await queryInterface.removeColumn("quotation_generations", "notes");
  }
};
