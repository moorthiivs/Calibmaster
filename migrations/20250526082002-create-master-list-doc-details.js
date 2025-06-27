'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MasterListDocDetails', {
      detailId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      mslId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'MasterListDocs',
          key: 'mslId'
        },
        onDelete: 'CASCADE'
      },
      groupName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      docNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      docTitle: {
        type: Sequelize.STRING,
        allowNull: false
      },
      revisionNo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      issueRevDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      effectiveStartDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      effectiveEndDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      retentionPeriod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      possession: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('MasterListDocDetails');
  }
};
