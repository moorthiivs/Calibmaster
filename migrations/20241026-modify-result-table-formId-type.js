'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('result_tables');

    if (!tableDesc.new_fromId) {
      await queryInterface.addColumn('result_tables', 'new_fromId', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
    await queryInterface.sequelize.query(`
      UPDATE "result_tables"
      SET "new_fromId" = CAST("fromId" AS INTEGER)
      WHERE "fromId" ~ '^[0-9]+$'; -- Only update numeric 'fromId' values
    `);
    await queryInterface.removeColumn('result_tables', 'fromId');

    await queryInterface.renameColumn('result_tables', 'new_fromId', 'fromId');

    await queryInterface.changeColumn('result_tables', 'fromId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('result_tables');

    if (!tableDesc.fromId) {
      await queryInterface.addColumn('result_tables', 'fromId', {
        type: Sequelize.STRING,
        allowNull: false,
      });

      await queryInterface.sequelize.query(`
      UPDATE result_tables
      SET fromId = new_fromId::text
      WHERE new_fromId IS NOT NULL;
    `);

      if (tableDesc.new_fromId) {
        await queryInterface.removeColumn('result_tables', 'new_fromId');
      }
    }
  }
}
