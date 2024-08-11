'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class procedure_uncertainties extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  procedure_uncertainties.init(
    {
      procedure_uncertainty_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      master_design_procedure_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      uncertainty_master_parameter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: 'procedure_uncertainties',
    }
  );

  procedure_uncertainties.associate = function (models) {

  }

  return procedure_uncertainties;
};