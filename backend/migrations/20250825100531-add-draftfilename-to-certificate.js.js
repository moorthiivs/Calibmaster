'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Certificates", "draftFileName", {
      type: Sequelize.STRING,
      allowNull: true, // set to false if you want to enforce it
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Certificates", "draftFileName");
  }
};
