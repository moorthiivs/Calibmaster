"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SRFItems", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      sno: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      make: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      range_min: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      range_max: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      range_unit: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      serialno: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      idno: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      remarks: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ulrno: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      calibration_done_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      calibration_done_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      report_done_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      report_done_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dispatch_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      dispatch_dc: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dispatch_mode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoice_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      report_dispatch_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      report_dispatch_mode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      calibration_reminder_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      rstatus: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("SRFItems");
  },
};
