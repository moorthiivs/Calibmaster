"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("calibration_data", {
      id: {
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
      task_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "task_items",
          key: "task_item_id"
        },
        onDelete: "CASCADE"
      },
      srf_item_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "srfitems",
          key: "srf_item_id"
        },
        onDelete: "CASCADE"
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
      reading_value: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      standard_instrument_used: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      environmental_conditions: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      calibration_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      client_created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_synced: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex("calibration_data", ["task_id"]);
    await queryInterface.addIndex("calibration_data", ["task_item_id"]);
    await queryInterface.addIndex("calibration_data", ["srf_item_id"]);
    await queryInterface.addIndex("calibration_data", ["user_id"]);
    await queryInterface.addIndex("calibration_data", ["is_synced"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("calibration_data");
  }
};
