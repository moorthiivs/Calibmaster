'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('ProcedureResult', 'print_on_observation', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('ProcedureResult', 'decimalPrecision', {
      type: Sequelize.JSON,
      allowNull: true,
    });


  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProcedureResult', 'print_on_observation');
    await queryInterface.removeColumn('ProcedureResult', 'decimalPrecision');
  }
};
