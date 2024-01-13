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

    return queryInterface.bulkInsert('cmssettings', [
      {
        cmssetting_id: '1',
        setting_name: "ENABLE_CERTIFICATE_GENERATION",
        setting_lable: "ENABLE CERTIFICATE GENERATION",
        setting_description: "This setting is used to display certificates",
        setting_value: "NO"
      },
      {
        cmssetting_id: '2',
        setting_name: "SEND_SRF_MAIL",
        setting_lable: "SEND SRF MAIL",
        setting_description: "This setting is used to sending SRF as mail, the SRF will be sent as excel",
        setting_value: "NO"
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('cmssettings', null, {});
  }
};
