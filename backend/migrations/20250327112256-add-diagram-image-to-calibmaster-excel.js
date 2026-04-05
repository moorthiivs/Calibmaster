'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('CalibmasterExcels', 'diagram_image', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
      defaultValue: []
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('CalibmasterExcels', 'diagram_image');
  }
};