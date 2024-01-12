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
        instrument_group_id: '22',
        instrument_discipline_id: '4',
        group_details: 'Equipment'
      },
      {
        instrument_group_id: '23',
        instrument_discipline_id: '4',
        group_details: 'Optical'
      },
      {
        instrument_group_id: '24',
        instrument_discipline_id: '4',
        group_details: 'Miscellaneous'
      },
    ], {});
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
