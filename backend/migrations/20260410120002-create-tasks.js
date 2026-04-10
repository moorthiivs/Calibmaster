"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tasks", {
      task_id: {
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
      task_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      srf_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "srf_lists",
          key: "srf_id"
        },
        onDelete: "SET NULL"
      },
      assigned_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM("assigned", "in_progress", "completed"),
        defaultValue: "assigned"
      },
      sync_status: {
        type: Sequelize.ENUM("pending", "synced"),
        defaultValue: "pending"
      },
      priority: {
        type: Sequelize.ENUM("low", "medium", "high"),
        defaultValue: "medium"
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id"
        },
        onDelete: "SET NULL"
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex("tasks", ["user_id"]);
    await queryInterface.addIndex("tasks", ["status"]);
    await queryInterface.addIndex("tasks", ["sync_status"]);
    await queryInterface.addIndex("tasks", ["created_by"]);
    await queryInterface.addIndex("tasks", ["task_name"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("tasks");
  }
};
