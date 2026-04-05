'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ProcedureResult', 'HiddenSheets', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Stores names of hidden sheets'
    })

    await queryInterface.addColumn('ProcedureResult', 'cmeid', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Reference to CalibmasterExcels.cmeid'
    })

    await queryInterface.sequelize.query(`
        UPDATE "ProcedureResult" pr
        SET "cmeid" = ce."cmeid",
            "HiddenSheets" = ce."HiddenSheets"
        FROM "CalibmasterExcels" ce
        WHERE pr."master_design_procedure_id" = ce."master_design_procedure_id"
          AND pr."labid" = ce."labid"
          AND pr."master_design_procedure_id" IS NOT NULL
          AND (ce."cmeid" IS NOT NULL OR ce."HiddenSheets" IS NOT NULL);
    `)
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProcedureResult', 'HiddenSheets')
    await queryInterface.removeColumn('ProcedureResult', 'cmeid')
  }
}
