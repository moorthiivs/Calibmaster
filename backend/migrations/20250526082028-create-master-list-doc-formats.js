'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MasterListDocFormats', {
      formatId: {
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
      detailId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'MasterListDocDetails',
          key: 'detailId'
        },
        onDelete: 'CASCADE'
      },
      formatName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sectionNo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      revNo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      revStartDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      revEndDate: {
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
    await queryInterface.dropTable('MasterListDocFormats');
  }
};
