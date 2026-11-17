'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('srf_approval_histories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      srf_item_id: {
        type: Sequelize.BIGINT
      },
      stage_type: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      acted_by: {
        type: Sequelize.INTEGER
      },
      acted_at: {
        type: Sequelize.DATE
      },
      comments: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('srf_approval_histories');
  }
};