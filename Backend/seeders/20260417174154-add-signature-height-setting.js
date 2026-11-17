'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('cmssettings', [
      {
        cmssetting_id: 9,
        setting_name: "SIGNATURE_HEIGHT_CERTIFICATE",
        setting_lable: "Signature Image Height (0-100)",
        setting_description: "Determines the height (size) of signature images in the certificate PDF.",
        setting_value: "40"
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('cmssettings', { setting_name: "SIGNATURE_HEIGHT_CERTIFICATE" }, {});
  }
};
