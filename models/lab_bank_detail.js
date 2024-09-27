'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BankDetails extends Model {
    static associate(models) {
      BankDetails.belongsTo(models.Lab, {
        as: "lab",
        constraints: true,
        onDelete: "CASCADE",
        foreignKey: "lab_id"
      });
    }
  }

  BankDetails.init(
    {
      lab_bank_detail_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      bank_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      account_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      branch: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ifsc_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      }
    },
    {
      sequelize,
      modelName: 'bank_details',
    }
  );

  return BankDetails;
};
