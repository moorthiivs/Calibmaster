'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class master_from_table extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  master_from_table.init(
    {
      master_from_table_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },

      calibration_procedure: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      ulr_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      validity: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      traceability: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      calibration_procedure: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      temperature: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      humidity: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      atmospheric_pressure: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'master_from_table',
    }
  );

  master_from_table.associate = function (models) {
    master_from_table.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id",
    });
  };

  return master_from_table;
};