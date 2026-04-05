'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.addColumn('srfitems', 'calibrationAt', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('srfitems', 'labtype', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('srfitems', 'ranges', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.changeColumn('srfitems', 'dispatch_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Copy data from srf_list to srfitem
    await queryInterface.sequelize.query(`
      UPDATE srfitems
      SET "labtype" = s."srf_type"
      FROM srf_lists s
      WHERE srfitems.srf_id = s.srf_id
    `);
  },

  down: async (queryInterface, Sequelize) => {

    await queryInterface.removeColumn('srfitems', 'calibrationAt');
    await queryInterface.removeColumn('srfitems', 'labtype');
    await queryInterface.removeColumn('srfitems', 'ranges');

    await queryInterface.changeColumn('srfitems', 'dispatch_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }
};
