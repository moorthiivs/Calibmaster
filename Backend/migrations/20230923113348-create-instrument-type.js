'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instrument_types', {

      instrument_type_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      instrument_type_spec: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      instrument_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "instruments",
          key: "instrument_id"
        }
      },

      instrument_full_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      range_minimum: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      range_minimum_uom_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "UOMs",
          key: "uom_id"
        }
      },

      range_maximum: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      range_maximum_uom_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "UOMs",
          key: "uom_id"
        }
      },

      least_count: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      least_count_uom_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "UOMs",
          key: "uom_id"
        }
      },

      size_spec: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      size_spec_uom_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "UOMs",
          key: "uom_id"
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
    await queryInterface.dropTable('instrument_types');
  }
};