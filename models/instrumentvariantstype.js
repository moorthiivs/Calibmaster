'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InstrumentVariantsType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  InstrumentVariantsType.init({
    instrumentVariantsType: DataTypes.STRING,
    createdBy: DataTypes.INTEGER,
    updatedBy: DataTypes.INTEGER,
    labid:DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'InstrumentVariantsType',
  });
  return InstrumentVariantsType;
};