"use strict";
module.exports = (sequelize, DataTypes) => {

  const SRFs = sequelize.define("SRFs",
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
      CompanyId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: 'SRFs',
      timestamps: false
    }
  );

  SRFs.associate = function (models) {
    SRFs.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id"
    });
    SRFs.belongsTo(models.Company, {
      as: "Company",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "customer_id",
    });
  };
  return SRFs;
};
