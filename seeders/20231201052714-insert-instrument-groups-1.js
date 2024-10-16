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

    return queryInterface.bulkInsert('instrument_groups', [
      {
        instrument_group_id: '1',
        instrument_discipline_id: '1',
        group_details: 'Alternating Current (< 1 GHz)'
      },
      {
        instrument_group_id: '2',
        instrument_discipline_id: '1',
        group_details: 'Direct Current'
      },
      {
        instrument_group_id: '3',
        instrument_discipline_id: '1',
        group_details: 'Electrical equipment'
      },
      {
        instrument_group_id: '4',
        instrument_discipline_id: '1',
        group_details: 'EMI/EMC'
      },
      {
        instrument_group_id: '5',
        instrument_discipline_id: '1',
        group_details: 'RF/Microwave (1 GHz and Above)'
      },
      {
        instrument_group_id: '6',
        instrument_discipline_id: '1',
        group_details: 'Temperature Simulation'
      },
      {
        instrument_group_id: '7',
        instrument_discipline_id: '1',
        group_details: 'Time & Frequency'
      },
      {
        instrument_group_id: '8',
        instrument_discipline_id: '1',
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
