'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserTrackConfig extends Model {
    static associate(models) {
      // No associations needed for global config
    }
  }
  UserTrackConfig.init({
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
    },
    resetPassword: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'admin123'
    }
  }, {
    sequelize,
    modelName: 'UserTrackConfig',
    tableName: 'EmployeeTrackConfig'
  });
  return UserTrackConfig;
};
