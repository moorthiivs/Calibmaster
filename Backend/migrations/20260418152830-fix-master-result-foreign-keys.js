'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Drop old constraints pointing to employee_masters
    // Note: Constraint names usually follow the pattern: table_column_fkey
    await queryInterface.removeConstraint('master_result_tables', 'master_result_tables_calibrated_employee_id_fkey').catch(e => console.log("Constraint master_result_tables_calibrated_employee_id_fkey not found, skipping."));
    await queryInterface.removeConstraint('master_result_tables', 'master_result_tables_approved_employee_id_fkey').catch(e => console.log("Constraint master_result_tables_approved_employee_id_fkey not found, skipping."));
    await queryInterface.removeConstraint('master_result_tables', 'master_result_tables_authorizedby_employee_id_fkey').catch(e => console.log("Constraint master_result_tables_authorizedby_employee_id_fkey not found, skipping."));

    // 2. Add new constraints pointing to Users table
    await queryInterface.addConstraint('master_result_tables', {
      fields: ['calibrated_user_id'],
      type: 'foreign key',
      name: 'master_result_tables_calibrated_user_id_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('master_result_tables', {
      fields: ['approved_user_id'],
      type: 'foreign key',
      name: 'master_result_tables_approved_user_id_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('master_result_tables', {
      fields: ['authorizedby_user_id'],
      type: 'foreign key',
      name: 'master_result_tables_authorizedby_user_id_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert to employee_masters (assuming columns are renamed back in another migration's down)
    await queryInterface.removeConstraint('master_result_tables', 'master_result_tables_calibrated_user_id_fkey');
    await queryInterface.removeConstraint('master_result_tables', 'master_result_tables_approved_user_id_fkey');
    await queryInterface.removeConstraint('master_result_tables', 'master_result_tables_authorizedby_user_id_fkey');

    await queryInterface.addConstraint('master_result_tables', {
      fields: ['calibrated_user_id'],
      type: 'foreign key',
      name: 'master_result_tables_calibrated_employee_id_fkey',
      references: {
        table: 'employee_masters',
        field: 'employee_id'
      },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('master_result_tables', {
      fields: ['approved_user_id'],
      type: 'foreign key',
      name: 'master_result_tables_approved_employee_id_fkey',
      references: {
        table: 'employee_masters',
        field: 'employee_id'
      },
      onDelete: 'CASCADE'
    });

    await queryInterface.addConstraint('master_result_tables', {
      fields: ['authorizedby_user_id'],
      type: 'foreign key',
      name: 'master_result_tables_authorizedby_employee_id_fkey',
      references: {
        table: 'employee_masters',
        field: 'employee_id'
      },
      onDelete: 'CASCADE'
    });
  }
};
