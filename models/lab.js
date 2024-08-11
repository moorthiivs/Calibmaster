"use strict";

module.exports = (sequelize, DataTypes) => {
  const Lab = sequelize.define("Lab",
    {
      // Model attributes are defined here
      lab_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      lab_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      calibmaster_lab_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address3: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pincode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lab_website: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_number1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_number2: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      symbol: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      rstatus: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      email_smtp_server_host: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email_smtp_server_port: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sender_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      sender_password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gst_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lab_active_flag: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      brand_logo_filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      brand_logo_mime_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      brand_logo: {
        type: DataTypes.BLOB("long"),
        allowNull: false,
      },

      other_logo1_image_filename: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      other_logo1_image_mime_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      other_logo1_image: {
        type: DataTypes.BLOB("long"),
        allowNull: true,
      },

      other_logo2_image_filename: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      other_logo2_image_mime_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      other_logo2_image: {
        type: DataTypes.BLOB("long"),
        allowNull: true,
      },

      seal_image_filename: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      certificate_accreditation_qr_code_logo_1: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      certificate_accreditation_url_1: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      scope_accreditation_qr_code_logo_2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      scope_accreditation_url_2: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      created_timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      created_by_login_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      created_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      updated_timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_by_login_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      updated_by_user_id: {
        type: DataTypes.STRING,
        allowNull: true
      },

      effective_start_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      effective_end_date: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      timestamps: false,
    }
  );
  return Lab;
};
