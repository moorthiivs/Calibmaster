'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class srf_approval_history extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      srf_approval_history.belongsTo(models.User, {
        as: "actedByUser",
        foreignKey: "acted_by"
      });
      srf_approval_history.belongsTo(models.srfitem, {
        as: "srf_item",
        foreignKey: "srf_item_id"
      });
    }
  }
  srf_approval_history.init({
    srf_item_id: DataTypes.BIGINT,
    stage_type: DataTypes.STRING,
    status: DataTypes.STRING,
    acted_by: DataTypes.INTEGER,
    acted_at: DataTypes.DATE,
    comments: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'srf_approval_history',
  });
  return srf_approval_history;
};