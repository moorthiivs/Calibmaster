'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('master_result_tables', 'authorizedby_employee_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'employee_masters',
        key: 'employee_id'
      },
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('master_result_tables', 'authorizedby_employee_id');
  }
};
