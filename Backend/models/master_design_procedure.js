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

      unique_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      calibration_procedure: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ref_std: {
        type: DataTypes.STRING,
        allowNull: true,
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
        //type: DataTypes.STRING,
        type: DataTypes.JSON,
        allowNull: true,
      },
      humidity: {
        //type: DataTypes.STRING,
        type: DataTypes.JSON,
        allowNull: true,
      },
      atmospheric_pressure: {
        type: DataTypes.STRING,
        allowNull: true
      },
      frequency: {
        type: DataTypes.STRING,
        allowNull: true
      },
      document_format: {
        type: DataTypes.JSON,
        allowNull: true
      },

      master_list_equipments: {
        type: DataTypes.ARRAY(DataTypes.JSON),
        allowNull: false
      },

      remarks: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
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

    master_design_procedure.hasMany(models.procedure_uncertainties, {
      as: "procedure_uncertainties",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "master_design_procedure_id"
    });

    // master_design_procedure.belongsToMany(models.uncertainty_master_parameter, {
    //   through: models.procedure_uncertainties,
    //   as: "uncertainty_master_parameter",
    //   foreignKey: "master_design_procedure_id"
    // })

    // master_design_procedure.belongsToMany(models.uncertainty_master_parameter, {
    //   through: models.procedure_uncertainties,
    //   as: 'uncertainty_master_parameter',
    //   foreignKey: 'master_design_procedure_id'
    // });
  };

  return master_design_procedure;
};