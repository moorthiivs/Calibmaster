'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class employee_master extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  employee_master.init(
    {
      employee_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },

      employee_title: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      employee_full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      employee_role: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      employee_signature: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      employee_enable: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'employee_master',
    }
  );

  return employee_master;
};