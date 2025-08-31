'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('srfitems', 'deletedby_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('srfitems', 'inward_no', {
      type: Sequelize.STRING,
      allowNull: true,
    });

  },

  async down(queryInterface, Sequelize) {
    // Safe down migration: remove only if column exists
    const table = await queryInterface.describeTable('srfitems');

    if (table.deletedby_id) {
      await queryInterface.removeColumn('srfitems', 'deletedby_id');
    }

    if (table.inward_no) {
      await queryInterface.removeColumn('srfitems', 'inward_no');
    }

  }
};
