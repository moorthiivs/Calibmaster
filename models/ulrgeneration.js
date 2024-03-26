'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class ULRGeneration extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  ULRGeneration.init(
    {
      ulr_generation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      accreditationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      currentYear: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      location: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      runningNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accreditedScope: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      effectiveStartDate: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      effectiveEndDate: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      effectiveFlag: {
        type: DataTypes.STRING,
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: 'ULRGeneration',
      timestamps: false
    }
  );

  ULRGeneration.associate = function (models) {

    ULRGeneration.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id"
    });

  };


  return ULRGeneration;
};