'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('master_design_procedures', 'remarks', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('master_design_procedures', 'remarks', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false
    });
  }
};
