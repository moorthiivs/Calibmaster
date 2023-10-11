'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class srf extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  srf.init(
    {

      srf_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },

      srf_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      srf_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      srf_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      contact_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_email: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      customer_dc: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      customer_dc_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      send_srf_via_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      agreed_completion_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      next_cal_due_require_flag: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'No'
      },
      reminder_frequency: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      statement_of_confirmity_flag: {
        type: DataTypes.STRING(2500),
        allowNull: false,
        defaultValue: 'No'
      },
      statement_of_confirmity: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      uncertainity_consider_flag: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'No'
      },

      issue_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      amend_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      amend_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      rstatus: {
        type: DataTypes.INTEGER,
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
    },
    {
      sequelize,
      modelName: 'srf',
      timestamps: false
    }
  );

  srf.associate = function (models) {
    srf.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id"
    });
    srf.belongsTo(models.Company, {
      as: "Company",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "customer_id",
    });
  };

  return srf;
};