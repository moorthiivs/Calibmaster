'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class UOM extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  UOM.init(
    {
      uom_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        defaultValue: sequelize.Sequelize.literal("nextval('uom_id_seq')")
      },
      uom_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      uom_kindofquantity: {
        type: DataTypes.STRING,
        allowNull: false
      },
      uom_printsysmbol: {
        type: DataTypes.STRING,
        allowNull: false
      },

      uom_casesensitive: {
        type: DataTypes.STRING,
        allowNull: true
      },
      uom_caseinsensitive: {
        type: DataTypes.STRING,
        allowNull: true
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
      },
    },
    {
      sequelize,
      modelName: 'UOM',
      timestamps: false
    }
  );
  return UOM;
};