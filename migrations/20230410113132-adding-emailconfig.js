"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn("Labs", "senderEmail", {
    //   type: Sequelize.DataTypes.STRING,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("Labs", "senderPassword", {
    //   type: Sequelize.DataTypes.STRING,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("Labs", "host", {
    //   type: Sequelize.DataTypes.STRING,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("Labs", "port", {
    //   type: Sequelize.DataTypes.INTEGER,
    //   allowNull: true,
    // });
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.removeColumn("Labs", "senderEmail");
    // await queryInterface.removeColumn("Labs", "senderPassword");
    // await queryInterface.removeColumn("Labs", "host");
    // await queryInterface.removeColumn("Labs", "port");
  },
};
