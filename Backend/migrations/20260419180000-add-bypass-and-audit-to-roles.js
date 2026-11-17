'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add bypassPermissions column
    await queryInterface.addColumn('roles', 'bypassPermissions', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'If true, this role bypasses all permission checks'
    });

    // Add createdBy column
    await queryInterface.addColumn('roles', 'createdBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'userId of the user who created this role'
    });

    // Add updatedBy column
    await queryInterface.addColumn('roles', 'updatedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'userId of the user who last updated this role'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('roles', 'bypassPermissions');
    await queryInterface.removeColumn('roles', 'createdBy');
    await queryInterface.removeColumn('roles', 'updatedBy');
  }
};
