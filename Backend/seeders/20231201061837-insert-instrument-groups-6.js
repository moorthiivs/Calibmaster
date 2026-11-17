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
        instrument_group_id: '28',
        instrument_discipline_id: '6',
        group_details: 'Specific heat & Humidity'
      },
      {
        instrument_group_id: '29',
        instrument_discipline_id: '6',
        group_details: 'Temperature'
      },
      {
        instrument_group_id: '30',
        instrument_discipline_id: '6',
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
