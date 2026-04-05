'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('master_design_procedures', 'document_format', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('master_design_procedures', 'document_format');
  }
};
