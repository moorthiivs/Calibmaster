"use strict";
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define("Task", {
    task_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // user_id replaces engineer_id — references users table directly (no engineers table needed)
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" }
    },
    task_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // srf_id tracks which SRF this task was created from
    srf_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "srf_lists", key: "srf_id" }
    },
    assigned_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("assigned", "in_progress", "completed"),
      defaultValue: "assigned"
    },
    sync_status: {
      type: DataTypes.ENUM("pending", "synced"),
      defaultValue: "pending"
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      defaultValue: "medium"
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" }
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
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
    tableName: "tasks",
    timestamps: false
  });

  Task.associate = (models) => {
    Task.belongsTo(models.User, { foreignKey: "user_id",    as: "engineer" });
    Task.belongsTo(models.User, { foreignKey: "created_by", as: "creator" });
    Task.belongsTo(models.srf_list, { foreignKey: "srf_id", as: "srf" });
    Task.hasMany(models.TaskItem,       { foreignKey: "task_id", as: "items" });
    Task.hasMany(models.CalibrationData,{ foreignKey: "task_id", as: "calibration_data" });
  };

  return Task;
};
