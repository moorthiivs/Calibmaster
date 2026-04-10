"use strict";
module.exports = (sequelize, DataTypes) => {
  const TaskItem = sequelize.define("TaskItem", {
    task_item_id: {
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
    // srf_item_id points to exact SRF item — nullable for ad-hoc items
    srf_item_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "srfitems", key: "srf_item_id" }
    },
    // instrument_type_id links to the defined instrument template — used for ad-hoc tasking
    instrument_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "instrument_types", key: "instrument_type_id" }
    },
    // srf_id denormalised here for fast querying — same as parent task's srf_id
    srf_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "srf_lists", key: "srf_id" }
    },
    calibration_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    calibration_status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed"),
      defaultValue: "pending"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lab_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
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
    tableName: "task_items",
    timestamps: false
  });

  TaskItem.associate = (models) => {
    TaskItem.belongsTo(models.Task,    { foreignKey: "task_id",    as: "task" });
    TaskItem.belongsTo(models.srfitem, { foreignKey: "srf_item_id", as: "srfItem" });
    TaskItem.belongsTo(models.instrument_type, { foreignKey: "instrument_type_id", as: "instrumentType" });
    TaskItem.hasMany(models.CalibrationData, { foreignKey: "task_item_id", as: "calibration_data" });
  };

  return TaskItem;
};
