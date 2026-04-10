"use strict";
module.exports = (sequelize, DataTypes) => {
  const CalibrationData = sequelize.define("CalibrationData", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "tasks", key: "task_id" }
    },
    task_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "task_items", key: "task_item_id" }
    },
    // srf_item_id points to the exact SRF item — nullable for unsynced Master items
    srf_item_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "srfitems", key: "srf_item_id" }
    },
    // user_id replaces engineer_id — references users table directly
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" }
    },
    reading_value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    standard_instrument_used: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    environmental_conditions: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    calibration_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    client_created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_synced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: "calibration_data",
    timestamps: false
  });

  CalibrationData.associate = (models) => {
    CalibrationData.belongsTo(models.Task,    { foreignKey: "task_id",      as: "task" });
    CalibrationData.belongsTo(models.TaskItem,{ foreignKey: "task_item_id", as: "task_item" });
    CalibrationData.belongsTo(models.srfitem, { foreignKey: "srf_item_id",  as: "srfItem" });
    CalibrationData.belongsTo(models.User,    { foreignKey: "user_id",      as: "calibratedBy" });
  };

  return CalibrationData;
};
