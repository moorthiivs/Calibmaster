'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProcedureResult', {
      prid: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      FileName: {
        type: Sequelize.STRING
      },
      ExcelData: {
        type: Sequelize.JSON,
        
      },
      Mergedcell: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      Styles: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      srf_id: {
        type: Sequelize.INTEGER
      },
      srf_item_id: {
        type: Sequelize.INTEGER
      },
      print_on_certificate: {
        type: Sequelize.JSON
      },
      createdby: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedby: {
        type: Sequelize.INTEGER
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ProcedureResult');
  }
};
