"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("task_items", {
      task_item_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "tasks",
          key: "task_id"
        },
        onDelete: "CASCADE"
      },
      srf_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "srf_lists",
          key: "srf_id"
        },
        onDelete: "CASCADE"
      },
      srf_item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "srfitems",
          key: "srf_item_id"
        },
        onDelete: "CASCADE"
      },
      instrument_type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "instrument_types",
          key: "instrument_type_id"
        },
        onDelete: "SET NULL"
      },
      instrument_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Masterlists",
          key: "id"
        },
        onDelete: "SET NULL"
      },
      calibration_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      calibration_status: {
        type: Sequelize.ENUM("pending", "in_progress", "completed"),
        defaultValue: "pending"
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      lab_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
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

    await queryInterface.addIndex("task_items", ["task_id"]);
    await queryInterface.addIndex("task_items", ["instrument_id"]);
    await queryInterface.addIndex("task_items", ["calibration_status"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("task_items");
  }
};
