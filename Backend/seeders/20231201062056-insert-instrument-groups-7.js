'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    await queryInterface.bulkInsert('instrument_groups', [
      {
        instrument_group_id: '31',
        instrument_discipline_id: '7',
        group_details: 'Discharge Equipment/ Devices'
      },
      {
        instrument_group_id: '32',
        instrument_discipline_id: '7',
        group_details: 'Patient Conditioning/ Maintenance'
      },
      {
        instrument_group_id: '33',
        instrument_discipline_id: '7',
        group_details: 'Monitoring Unit'
      },
      {
        instrument_group_id: '34',
        instrument_discipline_id: '7',
        group_details: 'Imaging/Plotters'
      },
      {
        instrument_group_id: '35',
        instrument_discipline_id: '7',
        group_details: 'Medical Device Analyzer/ Simulator Equipment'
      },
      {
        instrument_group_id: '36',
        instrument_discipline_id: '7',
        group_details: 'Miscellaneous'
      }
    ], { ignoreDuplicates: true, });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    await queryInterface.bulkDelete('instrument_groups', null, {});
  }
};
