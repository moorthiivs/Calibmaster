'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MasterListDocDetail extends Model {
    static associate(models) {
      MasterListDocDetail.belongsTo(models.MasterListDoc, {
        foreignKey: 'mslId',
        as: 'masterDoc',
        onDelete: 'CASCADE'
      });
    }
  }

  MasterListDocDetail.init({
    detailId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    mslId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    docNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    docTitle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    revisionNo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    issueRevDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    effectiveStartDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    effectiveEndDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    retentionPeriod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    possession: {
      type: DataTypes.STRING,
      allowNull: true
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
    modelName: 'MasterListDocDetail',
    tableName: 'MasterListDocDetails',
    timestamps: true
  });

  return MasterListDocDetail;
};
