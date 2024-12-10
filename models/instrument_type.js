'use strict';

const { Model } = require('sequelize');

const instrument = require("./").instrument;

module.exports = (sequelize, DataTypes) => {

  class instrument_type extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  instrument_type.init(
    {
      instrument_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: sequelize.Sequelize.literal("nextval('instrument_types_instrument_type_id_seq')")
      },
      instrument_type_spec: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      instrument_full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      range_minimum: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      range_maximum: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },

      least_count: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },

      size_spec: {
        type: DataTypes.DECIMAL,
        allowNull: true,
      },
      
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      created_timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      created_by_login_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      created_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      updated_timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_by_login_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      updated_by_user_id: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'instrument_type',
      timestamps: false
    }
  );

  instrument_type.associate = function (models) {

    instrument_type.belongsTo(models.instrument, {
      as: "instrument",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "instrument_id",
    });

    instrument_type.belongsTo(models.UOM, {
      as: "range_minimum_uom",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "range_minimum_uom_id",
    });

    instrument_type.belongsTo(models.UOM, {
      as: "range_maximum_uom",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "range_maximum_uom_id",
    });

    instrument_type.belongsTo(models.UOM, {
      as: "least_count_uom",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "least_count_uom_id",
    });

    instrument_type.belongsTo(models.UOM, {
      as: "size_spec_uom",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "size_spec_uom_id",
    });

    instrument_type.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id",
    });
  }

  return instrument_type;
};