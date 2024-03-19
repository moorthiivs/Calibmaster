'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('design_procedures', {

      design_procedure_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fromId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      master_design_procedure_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "master_design_procedures",
          key: "master_design_procedure_id"
        },
      },

      unique_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      table_type: {
        type: Sequelize.STRING,
        allowNull: false
      },

      rows: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      columns: {
        type: Sequelize.STRING,
        allowNull: false,
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
        type: Sequelize.ARRAY(Sequelize.ARRAY(Sequelize.STRING)),
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
    await queryInterface.dropTable('design_procedures');
  }
};