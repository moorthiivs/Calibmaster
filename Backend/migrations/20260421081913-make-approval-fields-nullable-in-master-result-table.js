'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('master_result_tables', 'approved_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn('master_result_tables', 'authorizedby_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn('master_result_tables', 'calibrated_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('master_result_tables', 'approved_user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
    await queryInterface.changeColumn('master_result_tables', 'authorizedby_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn('master_result_tables', 'calibrated_user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  }
};
