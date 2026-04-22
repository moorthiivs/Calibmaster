'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('master_result_tables', 'calibrated_employee_id', 'calibrated_user_id');
    await queryInterface.renameColumn('master_result_tables', 'approved_employee_id', 'approved_user_id');
    await queryInterface.renameColumn('master_result_tables', 'authorizedby_employee_id', 'authorizedby_user_id');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('master_result_tables', 'calibrated_user_id', 'calibrated_employee_id');
    await queryInterface.renameColumn('master_result_tables', 'approved_user_id', 'approved_employee_id');
    await queryInterface.renameColumn('master_result_tables', 'authorizedby_user_id', 'authorizedby_employee_id');
  }
};
