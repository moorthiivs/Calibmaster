'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn('srf_lists', 'calibrationAt', {
    //   type: Sequelize.STRING,
    //   allowNull: true,
    // });

    // await queryInterface.addColumn('srf_lists', 'customer_code', {
    //   type: Sequelize.STRING,
    //   allowNull: true,
    // });

    await queryInterface.addColumn('srf_lists', 'deletedby_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn('srf_lists', 'srf_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    //await queryInterface.removeColumn('srf_lists', 'calibrationAt');
    //await queryInterface.removeColumn('srf_lists', 'customer_code');
    
    await queryInterface.removeColumn('srf_lists', 'deletedby_id');
    await queryInterface.changeColumn('srf_lists', 'srf_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }
};
