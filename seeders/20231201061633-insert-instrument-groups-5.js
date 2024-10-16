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
        instrument_group_id: '25',
        instrument_discipline_id: '5',
        group_details: 'Radiological measurements'
      },
      {
        instrument_group_id: '26',
        instrument_discipline_id: '5',
        group_details: 'Radio Isotope/Source Calibration'
      },
      {
        instrument_group_id: '27',
        instrument_discipline_id: '5',
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
