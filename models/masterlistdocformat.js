'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MasterListDocFormat extends Model {
    static associate(models) {
      MasterListDocFormat.belongsTo(models.MasterListDoc, {
        foreignKey: 'mslId',
        as: 'masterDoc',
        onDelete: 'CASCADE'
      });

      MasterListDocFormat.belongsTo(models.MasterListDocDetail, {
        foreignKey: 'detailId',
        as: 'docDetail',
        onDelete: 'CASCADE'
      });
    }
  }

  MasterListDocFormat.init({
    formatId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    mslId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    detailId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    formatName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sectionNo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    revNo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    revStartDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revEndDate: {
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
    modelName: 'MasterListDocFormat',
    tableName: 'MasterListDocFormats',
    timestamps: true
  });

  return MasterListDocFormat;
};
