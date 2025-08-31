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
        setting_description: "This setting is used to sending SRF as email, the SRF will be sent as excel",
        setting_value: "NO"
      },
      {
        cmssetting_id: '3',
        setting_name: "SEND_SRF_EMAIL_FORMAT",
        setting_lable: "Set SRF Email Format",
        setting_description: "This setting is used to sending SRF as email, the SRF will be sent as excel",
        setting_value: "PDF"
      },
      {
        cmssetting_id: '4',
        setting_name: "GENERATE_CERTIFICATE",
        setting_lable: "Generate Certificate",
        setting_description: "This setting is used to generating certificates pdf",
        setting_value: "NO"
      },
      {
        cmssetting_id: '5',
        setting_name: "SIGNATURE_PRINT_CERTIFICATE",
        setting_lable: "SIGNATURE PRINT CERTIFICATE",
        setting_description: "Determines whether the signature should be printed on the certificate PDF.",
        setting_value: "NO"
      },
      {
        cmssetting_id: '6',
        setting_name: "SEAL_PRINT_CERTIFICATE",
        setting_lable: "SEAL PRINT CERTIFICATE",
        setting_description: "Determines whether the seal should be printed on the certificate PDF.",
        setting_value: "NO"
      },
      {
        cmssetting_id: '7',
        setting_name: "WITNESSBY_PRINT_CERTIFICATE",
        setting_lable: "Witness By Print on Certificate",
        setting_description: "Determines whether 'Witness By' should be printed on the certificate PDF.",
        setting_value: "NO"
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
    return queryInterface.bulkDelete('cmssettings', null, {});
  }
};
