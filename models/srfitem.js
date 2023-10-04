"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class srfitem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      /* this.belongsTo(models.Lab, {
        as: "lab",
        constrains: true,
        onDelete: "CASCADE",
      });
      this.belongsTo(models.masterlist, {
        as: "masterlist",
        constrains: true,
      });
      this.belongsTo(models.srf, {
        constrains: true,
        onDelete: "CASCADE",
      });*/
    }
  }
  const SRFItem = sequelize.define("SRFItem", {
    // Model attributes are defined here
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    sno: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    make: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    range_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    range_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    range_unit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serialno: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    idno: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ulrno: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    calibration_done_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    calibration_done_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    report_done_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    report_done_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dispatch_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    dispatch_dc: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dispatch_mode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoice_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    report_dispatch_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    report_dispatch_mode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    calibration_reminder_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    rstatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  // SRFItem.associate = function (models) {
  //   SRFItem.belongsTo(models.Lab, {
  //     as: "lab",
  //     constrains: true,
  //     onDelete: "CASCADE",
  //     foreignKey: "labId"
  //   });
  //   SRFItem.belongsTo(models.Masterlist, {
  //     as: "masterlist",
  //     constrains: true,
  //   });
  //   SRFItem.belongsTo(models.SRFs, {
  //     as: "srf",
  //     constrains: true,
  //     onDelete: "CASCADE",
  //   });
  // };

  return SRFItem;
};
