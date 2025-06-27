'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MasterListDoc extends Model {
    static associate(models) {
      MasterListDoc.hasMany(models.MasterListDocDetail, {
        foreignKey: 'mslId',
        as: 'details',
        onDelete: 'CASCADE'
      });
      MasterListDoc.hasMany(models.MasterListDocFormat, {
        foreignKey: 'mslId',
        as: 'formats',
        onDelete: 'CASCADE'
      });
    }
  }

  MasterListDoc.init({
    mslId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    mslDocName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mslDocRevisionNo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mslRevDateStart: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    mslRevDateEnd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    labId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'MasterListDoc',
    tableName: 'MasterListDocs',
    timestamps: true
  });

  return MasterListDoc;
};
