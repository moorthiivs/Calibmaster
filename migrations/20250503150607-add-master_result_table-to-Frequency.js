'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('master_result_tables', 'frequency', {
      type: Sequelize.STRING,
      allowNull: true,
    }); 
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('master_result_tables', 'frequency');
  }
};
