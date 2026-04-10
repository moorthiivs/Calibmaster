"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sync_logs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      sync_type: {
        type: Sequelize.ENUM("push", "pull"),
        allowNull: false
      },
      records_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM("success", "partial", "failed"),
        allowNull: false
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      client_timestamp: {
        type: Sequelize.DATE,
        allowNull: true
      },
      server_timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex("sync_logs", ["user_id"]);
    await queryInterface.addIndex("sync_logs", ["sync_type"]);
    await queryInterface.addIndex("sync_logs", ["status"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sync_logs");
  }
};
