"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Labs", {
      // Model attributes are defined here
      lab_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      lab_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      calibmaster_lab_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address2: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address3: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pincode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lab_website: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contact_number1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      contact_number2: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      symbol: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      rstatus: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      email_smtp_server_host: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email_smtp_server_port: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sender_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sender_password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gst_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lab_active_flag: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      brand_logo_filename: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      brand_logo_mime_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      brand_logo: {
        type: Sequelize.BLOB("long"),
        allowNull: false,
      },

      other_logo1_image_filename: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      other_logo1_image_mime_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      other_logo1_image: {
        type: Sequelize.BLOB("long"),
        allowNull: true,
      },

      other_logo2_image_filename: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      other_logo2_image_mime_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      other_logo2_image: {
        type: Sequelize.BLOB("long"),
        allowNull: true,
      },

      created_timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_by_login_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      updated_timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_by_login_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      updated_by_user_id: {
        type: Sequelize.STRING,
        allowNull: true
      },

      effective_start_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      effective_end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Labs");
  },
};
