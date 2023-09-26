"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SRFs", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      sno: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      contact_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contact_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_dc: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      customer_dc_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      agreed_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      next_cal_due_require_flag: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      frequency: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      statement_of_confirmity_flag: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      statement_of_confirmity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      uncertainity_consider_flag: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      issue_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      amend_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      amend_date: {
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
    await queryInterface.dropTable("SRFs");
  },
};
