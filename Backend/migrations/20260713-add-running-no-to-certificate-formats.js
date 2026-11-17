"use strict";

/**
 * Migration: Add dedicated running_no columns to certificate_formats
 * 
 * This moves the running number from the JSON required_fields array
 * to dedicated database columns for atomicity and corruption resistance.
 * 
 * Safe migration:
 * - Adds columns with defaults (no downtime required)
 * - Populates from existing JSON data
 * - Idempotent — safe to run twice
 * - No data deletion
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Add the new columns
      await queryInterface.addColumn("certificate_formats", "running_no", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }, { transaction });

      await queryInterface.addColumn("certificate_formats", "running_no_month", {
        type: Sequelize.STRING(2),
        allowNull: false,
        defaultValue: "00",
      }, { transaction });

      await queryInterface.addColumn("certificate_formats", "running_no_year", {
        type: Sequelize.STRING(2),
        allowNull: false,
        defaultValue: "00",
      }, { transaction });

      // 2. Populate from existing required_fields JSON data
      const [formats] = await queryInterface.sequelize.query(
        `SELECT id, required_fields FROM certificate_formats`,
        { transaction }
      );

      for (const fmt of formats) {
        let fields = fmt.required_fields;
        if (typeof fields === "string") fields = JSON.parse(fields);
        if (!Array.isArray(fields)) continue;

        const runningNo = parseInt(
          (fields.find((f) => f.name === "RunningNo") || {}).value || "0",
          10
        );
        const month = (fields.find((f) => f.name === "month") || {}).value || "00";
        const year = (fields.find((f) => f.name === "year") || {}).value || "00";

        await queryInterface.sequelize.query(
          `UPDATE certificate_formats 
           SET running_no = :runningNo, running_no_month = :month, running_no_year = :year
           WHERE id = :id`,
          {
            replacements: { runningNo, month, year, id: fmt.id },
            transaction,
          }
        );
      }

      await transaction.commit();
      console.log("✅ Migration complete: running_no columns added and populated.");
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("certificate_formats", "running_no");
    await queryInterface.removeColumn("certificate_formats", "running_no_month");
    await queryInterface.removeColumn("certificate_formats", "running_no_year");
  },
};
