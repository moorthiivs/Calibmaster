'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('result_tables', {
      result_table_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      fromId: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      master_result_table_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "master_result_tables",
          key: "master_result_table_id"
        },
      },

      unique_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      rows: {
        type: Sequelize.STRING
      },
      columns: {
        type: Sequelize.STRING
      },
      header_types: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      header_texts: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      second_row_headers: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      cell_texts: {
        type: Sequelize.ARRAY(Sequelize.ARRAY(Sequelize.JSON)),
        allowNull: false
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('result_tables');
  }
};