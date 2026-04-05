'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EmployeeTracking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      EmployeeTracking.belongsTo(models.User, {
        foreignKey: "userId",
        as: "User"
      });
    }
  }
  EmployeeTracking.init({
    empTrackingId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    loginAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    logoutAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalHours: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    date: DataTypes.DATEONLY,
    status: DataTypes.STRING,
    logoutType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'EmployeeTracking',
  });
  return EmployeeTracking;
};