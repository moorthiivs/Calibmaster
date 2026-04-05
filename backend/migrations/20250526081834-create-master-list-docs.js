'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MasterListDocs', {
      mslId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      mslDocName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mslDocRevisionNo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mslRevDateStart: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      mslRevDateEnd: {
        type: Sequelize.DATE,
        allowNull: false
      },
      labId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('MasterListDocs');
  }
};
