'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InstrumentParameter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      InstrumentParameter.belongsTo(models.instrument, {
        foreignKey: 'InstrumentID',
        as: 'instrument',
        onDelete: 'CASCADE'
      });
    }
  }
  InstrumentParameter.init({
    InstrumentID: DataTypes.INTEGER,
    Instrumentparametername: DataTypes.STRING,
    InstrumentUOMID: DataTypes.INTEGER,
    InstrumentparameterUOM: DataTypes.STRING,
    labid: DataTypes.INTEGER,
    CreatedBy: DataTypes.STRING,
    UpdatedBy: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'InstrumentParameter',
  });
  return InstrumentParameter;
};