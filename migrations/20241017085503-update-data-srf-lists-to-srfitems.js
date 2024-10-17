'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('srf_lists');
    if (tableInfo.reminder_frequency && tableInfo.frequency_days) {
      // Fetch data from srf_lists
      const records = await queryInterface.sequelize.query(
        'SELECT srf_id, reminder_frequency, frequency_days FROM srf_lists',
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Update records in srfitems based on srf_lists data
      for (const record of records) {
        await queryInterface.bulkUpdate(
          'srfitems',
          {
            frequency_days: record.frequency_days,
            reminder_frequency: record.reminder_frequency
          },
          {
            srf_id: record.srf_id
          }
        );
      }
    }
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    if (tableInfo.reminder_frequency) {
      await queryInterface.removeColumn("srf_lists", "reminder_frequency");
    }
    if (tableInfo.frequency_days) {
      await queryInterface.removeColumn("srf_lists", "frequency_days");
    }
    if (tableInfo.next_cal_due_require_flag) {
      await queryInterface.removeColumn("srf_lists", "next_cal_due_require_flag");
    }
  },

  async down(queryInterface, Sequelize) {
    const records = await queryInterface.sequelize.query(
      'SELECT srf_id FROM srf_lists',
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const record of records) {
      await queryInterface.bulkUpdate(
        'srfitems',
        {
          frequency_days: null,
          reminder_frequency: null
        },
        {
          srf_id: record.srf_id
        }
      );
    }
  }
};
