'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CalibmasterExcels', 'labid', {
      type: Sequelize.INTEGER,
      allowNull: true,  // Change to false if labid is required
    });
  }, 

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('CalibmasterExcels', 'labid');
  }
};
