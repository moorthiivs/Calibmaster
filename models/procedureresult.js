'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProcedureResult extends Model {
    static associate(models) {
      // define association here if needed
    }
  }
  ProcedureResult.init({
    prid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    FileName: DataTypes.STRING,
    ExcelData: DataTypes.JSON,
    srf_id: DataTypes.INTEGER,
    srf_item_id: DataTypes.INTEGER,
    print_on_certificate: DataTypes.JSON,
    labid: DataTypes.INTEGER, 
    master_design_procedure_id:DataTypes.INTEGER,
    createdby: DataTypes.INTEGER,
    updatedby: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProcedureResult',
    tableName: 'ProcedureResult', // use singular if that's what you want in DB
    timestamps: true, // manages createdAt and updatedAt
  });
  return ProcedureResult;
};
