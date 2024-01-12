'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class instrument extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  instrument.init(
    {
      instrument_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: sequelize.Sequelize.literal("nextval('instruments_instrument_id_seq')")
      },
      instrument_name: {
        type: DataTypes.STRING,
        allowNull: false,
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
      modelName: 'instrument',
      timestamps: false
    }
  );

  instrument.associate = function (models) {

    instrument.belongsTo(models.UOM, {
      as: "UOM",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "instrument_uom_id",
    });

    instrument.belongsTo(models.instrument_discipline, {
      as: "discipline",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "instrument_discipline_id",
      allowNull: true
    });

    instrument.belongsTo(models.instrument_groups, {
      as: "group",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "instrument_group_id",
      allowNull: true
    });

    instrument.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id",
    });
  };

  return instrument;
};