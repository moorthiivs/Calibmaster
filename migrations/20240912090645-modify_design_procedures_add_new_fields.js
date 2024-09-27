'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('design_procedures');
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    if (!tableInfo.procedure_image_filename) {
      await queryInterface.addColumn("design_procedures", "procedure_image_filename", {
        type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.STRING),
        allowNull: false,
        defaultValue: []
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
    await queryInterface.removeColumn("design_procedures", "procedure_image_filename");
  }
};
