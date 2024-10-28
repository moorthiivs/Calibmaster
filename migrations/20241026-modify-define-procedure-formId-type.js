'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Describe the table structure to check existing columns
    const tableDesc = await queryInterface.describeTable('design_procedures');

    // 1. Add 'new_fromId' column if it doesn't exist
    if (!tableDesc.new_fromId) {
      await queryInterface.addColumn('design_procedures', 'new_fromId', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      UPDATE "design_procedures"
      SET "new_fromId" = CAST("fromId" AS INTEGER)
      WHERE "fromId" ~ '^[0-9]+$'; -- Only update numeric 'fromId' values
    `);

    if (tableDesc.fromId) {
      await queryInterface.removeColumn('design_procedures', 'fromId');
    }

    await queryInterface.renameColumn('design_procedures', 'new_fromId', 'fromId');

    await queryInterface.changeColumn('design_procedures', 'fromId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {

    const tableDesc = await queryInterface.describeTable('design_procedures');

    if (!tableDesc.fromId) {
      await queryInterface.addColumn('design_procedures', 'fromId', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
    await queryInterface.sequelize.query(`
      UPDATE design_procedures
      SET fromId = new_fromId::text
      WHERE new_fromId IS NOT NULL;
    `);
    if (tableDesc.new_fromId) {
      await queryInterface.removeColumn('design_procedures', 'new_fromId');
    }
  },
};
