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

    return queryInterface.bulkInsert('instrument_disciplines', [
      {
        instrument_discipline_id: '1',
        instrument_discipline: 'ELECTRO TECHNICAL'
      },
      {
        instrument_discipline_id: '2',
        instrument_discipline: 'FLUID FLOW'
      },
      {
        instrument_discipline_id: '3',
        instrument_discipline: 'MECHANICAL'
      },
      {
        instrument_discipline_id: '4',
        instrument_discipline: 'OPTICAL'
      },
      {
        instrument_discipline_id: '5',
        instrument_discipline: 'RADIOLOGICAL'
      },
      {
        instrument_discipline_id: '6',
        instrument_discipline: 'THERMAL'
      },
      {
        instrument_discipline_id: '7',
        instrument_discipline: 'MEDICAL DEVICES'
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('instrument_disciplines', null, {});
  }
};
