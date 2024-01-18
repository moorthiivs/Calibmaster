'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class master_result_table extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  master_result_table.init(
    {
      master_result_table_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },

      calibration_procedure: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ref_std: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      calibration: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      ulr_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      validity: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      traceability: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      temperature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      humidity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      atmospheric_pressure: {
        type: DataTypes.STRING,
        allowNull: true
      },
    },
    {
      sequelize,
      modelName: 'master_result_table',
    }
  );

  master_result_table.associate = function (models) {
    master_result_table.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id",
    });
  };

  return master_result_table;
};