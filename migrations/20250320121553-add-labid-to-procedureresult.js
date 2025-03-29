'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProcedureResult', 'labid', {
      type: Sequelize.INTEGER,
      allowNull: true,  // Change to false if labid is required
    });
  }, 

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProcedureResult', 'labid');
  }
};
