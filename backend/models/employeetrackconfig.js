'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EmployeeTrackConfig extends Model {
    static associate(models) {
      // No associations needed for global config
    }
  }
  EmployeeTrackConfig.init({
    configId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idleTimeoutMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20
    },
    preventConcurrentLogins: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'EmployeeTrackConfig',
    tableName: 'EmployeeTrackConfig'
  });
  return EmployeeTrackConfig;
};
