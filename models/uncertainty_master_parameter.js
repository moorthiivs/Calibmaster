'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class uncertainty_master_parameter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  uncertainty_master_parameter.init(
    {
      uncertainty_master_parameter_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      unique_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(1000),
        allowNull: false
      },
      parameter_type: {
        type: DataTypes.STRING,
        defaultValue: 'A',
        allowNull: false
      },
      distribution: {
        type: DataTypes.STRING,
        defaultValue: 'Normal',
        allowNull: false
      },
      dividing_factor: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false
      },
    },
    {
      sequelize,
      modelName: 'uncertainty_master_parameter',
    }
  );

  uncertainty_master_parameter.associate = function (models) {

    uncertainty_master_parameter.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id"
    });

  };

  return uncertainty_master_parameter;
};