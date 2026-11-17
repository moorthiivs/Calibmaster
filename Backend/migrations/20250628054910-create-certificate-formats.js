"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("certificate_formats", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      lab_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      format_template: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      required_fields: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      preview: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("certificate_formats");
  },
};
