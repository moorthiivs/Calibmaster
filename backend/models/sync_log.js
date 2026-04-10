"use strict";
module.exports = (sequelize, DataTypes) => {
  const SyncLog = sequelize.define("SyncLog", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    // user_id replaces engineer_id — references users table directly
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" }
    },
    sync_type: {
      type: DataTypes.ENUM("push", "pull"),
      allowNull: false
    },
    records_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM("success", "partial", "failed"),
      allowNull: false
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    client_timestamp: {
      type: DataTypes.DATE,
      allowNull: true
    },
    server_timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: "sync_logs",
    timestamps: false
  });

  SyncLog.associate = (models) => {
    SyncLog.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  };

  return SyncLog;
};
