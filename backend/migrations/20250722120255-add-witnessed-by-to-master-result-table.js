'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('master_result_tables', 'witnessed_by', {
      type: Sequelize.JSON,
      allowNull: true,
    });


    await queryInterface.addColumn('master_result_tables', 'deletedby_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('master_result_tables', 'witnessed_by');

    await queryInterface.removeColumn('master_result_tables', 'deletedby_id');
  }
};
