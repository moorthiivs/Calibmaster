'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('CalibmasterExcels');

    if (!tableDescription.is_deleted) {
      await queryInterface.addColumn('CalibmasterExcels', 'is_deleted', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      });
    }

    if (!tableDescription.deletedby) {
      await queryInterface.addColumn('CalibmasterExcels', 'deletedby', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!tableDescription.deleted_at) {
      await queryInterface.addColumn('CalibmasterExcels', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('CalibmasterExcels', 'is_deleted');
    await queryInterface.removeColumn('CalibmasterExcels', 'deletedby');
    await queryInterface.removeColumn('CalibmasterExcels', 'deleted_at');
  },
};
