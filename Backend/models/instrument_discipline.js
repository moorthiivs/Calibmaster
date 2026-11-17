'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class instrument_discipline extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  instrument_discipline.init(
    {
      instrument_discipline_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      instrument_discipline: {
        type: DataTypes.STRING,
        allowNull: false
      },
    },
    {
      sequelize,
      modelName: 'instrument_discipline',
      timestamps: false,
    }
  );
  return instrument_discipline;
};