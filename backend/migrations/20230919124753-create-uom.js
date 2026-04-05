'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.sequelize.query("CREATE SEQUENCE uom_id_seq start 1 increment 1");

    await queryInterface.createTable('UOMs',
      {
        uom_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          defaultValue: Sequelize.literal("nextval('uom_id_seq')")
        },

        uom_name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        uom_kindofquantity: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        uom_printsysmbol: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        uom_casesensitive: {
          type: Sequelize.STRING,
        },
        uom_caseinsensitive: {
          type: Sequelize.STRING,
        },

        created_timestamp: {
          type: Sequelize.DATE,
          allowNull: false
        },
        created_by_login_name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        created_by_user_id: {
          type: Sequelize.INTEGER,
          allowNull: false
        },

        updated_timestamp: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_by_login_name: {
          type: Sequelize.STRING,
          allowNull: true
        },
        updated_by_user_id: {
          type: Sequelize.STRING,
          allowNull: true
        },
      },
      {

      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UOMs');
    await queryInterface.sequelize.query("DROP SEQUENCE uom_id_seq");
  }
};