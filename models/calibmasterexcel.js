'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CalibmasterExcel extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }
  CalibmasterExcel.init({
    cmeid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    FileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    FileLocation: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ExcelData: {
      type: DataTypes.JSON,
      allowNull: true
    },
    diagram_image: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    },
    HiddenSheets: {
      type: DataTypes.JSON,
      allowNull: true
    },
    labid: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    master_design_procedure_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    createdby: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    updatedby: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'CalibmasterExcel',
    tableName: 'CalibmasterExcels',
  });
  return CalibmasterExcel;
};