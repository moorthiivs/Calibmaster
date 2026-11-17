'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class EParameter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  EParameter.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      issue_no: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      issue_date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amend_no: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amend_date: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lab_id: {
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
      },
    },
    {
      sequelize,
      modelName: 'EParameter',
      timestamps: false
    }
  );
  return EParameter;
};