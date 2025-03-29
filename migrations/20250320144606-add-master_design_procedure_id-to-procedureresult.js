'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('ProcedureResult', 'master_design_procedure_id', {
      type: Sequelize.INTEGER,
      allowNull: true // Change to false if labid is required
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProcedureResult', 'master_design_procedure_id')
  }
}
