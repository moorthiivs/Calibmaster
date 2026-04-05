'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('master_result_tables', 'document_format', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('master_result_tables', 'document_format');
  }
};
