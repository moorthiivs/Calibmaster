"use strict";
module.exports = (sequelize, DataTypes) => {
  const SRFs = sequelize.define("SRFs", {
    // Model attributes are defined here
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    sno: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
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
      allowNull: false,
    },
    customer_dc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_dc_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    agreed_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    next_cal_due_require_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    statement_of_confirmity_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    statement_of_confirmity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    uncertainity_consider_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    issue_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    amend_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amend_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    rstatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
  SRFs.associate = function (models) {
    SRFs.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      primaryKey: true,
    });
    SRFs.belongsTo(models.Company, {
      as: "Company",
      constrains: true,
      onDelete: "CASCADE",
    });
    SRFs.belongsTo(models.Company, {
      as: "reportcompany",
      constrains: true,
      onDelete: "CASCADE",
    });
  };
  return SRFs;
};
