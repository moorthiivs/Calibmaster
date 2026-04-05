'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instruments', {

      instrument_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      instrument_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      instrument_uom_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "UOMs",
          key: "uom_id"
        }
      },

      instrument_discipline_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "instrument_disciplines",
          key: "instrument_discipline_id"
        }
      },

      instrument_group_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "instrument_groups",
          key: "instrument_group_id"
        }
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
        allowNull: false
      },
      updated_by_user_id: {
        type: Sequelize.STRING,
        allowNull: false
      },

    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('instruments');
  }
};