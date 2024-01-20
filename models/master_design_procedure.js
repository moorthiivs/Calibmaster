'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class master_design_procedure extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  master_design_procedure.init(
    {
      master_design_procedure_id: {
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
      modelName: 'master_design_procedure',
    }
  );

  master_design_procedure.associate = function (models) {

    master_design_procedure.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id",
    });

    master_design_procedure.belongsTo(models.instrument_type, {
      as: "instrument_type",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "instrument_type_id",
    });

  };

  return master_design_procedure;
};