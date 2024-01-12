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
        instrument_group_id: '11',
        instrument_discipline_id: '3',
        group_details: 'Acceleration & Speed'
      },
      {
        instrument_group_id: '12',
        instrument_discipline_id: '3',
        group_details: 'Acoustics'
      },
      {
        instrument_group_id: '13',
        instrument_discipline_id: '3',
        group_details: 'Density and Viscosity'
      },
      {
        instrument_group_id: '14',
        instrument_discipline_id: '3',
        group_details: 'Dimension (Basic-Measuring Instrument, Gauges etc.)'
      },
      {
        instrument_group_id: '15',
        instrument_discipline_id: '3',
        group_details: 'Dimension (Precision- Precision Instruments and Surface Topology)'
      },
      {
        instrument_group_id: '16',
        instrument_discipline_id: '3',
        group_details: 'Hardness & Impact'
      },
      {
        instrument_group_id: '17',
        instrument_discipline_id: '3',
        group_details: 'Force'
      },
      {
        instrument_group_id: '18',
        instrument_discipline_id: '3',
        group_details: 'Mass and Volume'
      },
      {
        instrument_group_id: '19',
        instrument_discipline_id: '3',
        group_details: 'Pressure and Vacuum'
      },
      {
        instrument_group_id: '20',
        instrument_discipline_id: '3',
        group_details: 'Torque Generating & Measuring devices'
      },
      {
        instrument_group_id: '21',
        instrument_discipline_id: '3',
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
