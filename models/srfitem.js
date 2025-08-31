'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class srfitem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  srfitem.init(
    {
      srf_item_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },

      srf_item_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      make: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      model: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      serial_no: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      identification_details: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      remarks: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      calibration_done_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      calibration_done_by_empname: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      dispatch_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dispatch_dc: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      dispatch_mode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      report_done_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      report_done_by_empname: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      report_dispatch_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      report_dispatch_mode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      invoice_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      calibration_remainder_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      rstatus: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      certificate_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      certificate_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      condition_of_item: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      url_number: {
        type: DataTypes.STRING(20),
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

      calibration_due_date: {
        type: DataTypes.DATE,
        allowNull: true
      },

      calibration_remainder_date_1: {
        type: DataTypes.DATE,
        allowNull: true
      },
      calibration_remainder_date_2: {
        type: DataTypes.DATE,
        allowNull: true
      },
      calibration_remainder_date_3: {
        type: DataTypes.DATE,
        allowNull: true
      },
      calibration_remainder_date_4: {
        type: DataTypes.DATE,
        allowNull: true
      },
      calibration_remainder_date_5: {
        type: DataTypes.DATE,
        allowNull: true
      },


      invoice_date: {
        type: DataTypes.DATE,
        allowNull: true
      },

      invoice_due_date: {
        type: DataTypes.DATE,
        allowNull: true
      },

      invoice_file_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      reminder_frequency: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      frequency_days: {
        type: DataTypes.STRING,
        allowNull: true
      },
      deletedby_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      inward_no: {
        type: DataTypes.STRING,
        allowNull: true
      },
      calibrationAt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      labtype: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ranges: {
        type: DataTypes.JSON,
        allowNull: true,
      }

    },
    {
      sequelize,
      modelName: 'srfitem',
      timestamps: false
    }
  );

  srfitem.associate = function (models) {

    srfitem.belongsTo(models.srf_list, {
      as: "srf",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "srf_id"
    });

    srfitem.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id"
    });

    srfitem.belongsTo(models.instrument_type, {
      as: "intrument_type",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "intrument_type_id"
    });

    srfitem.belongsTo(models.User, { as: "deletedByUser", foreignKey: "deletedby_id" });
  };

  return srfitem;
};