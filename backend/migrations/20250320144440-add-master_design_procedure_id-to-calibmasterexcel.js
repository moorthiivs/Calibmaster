'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CalibmasterExcels', 'master_design_procedure_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }, 

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('CalibmasterExcels', 'master_design_procedure_id');
  }
};
