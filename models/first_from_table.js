'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class first_from_table extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  first_from_table.init(
    {
      first_from_table_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },

      fromId: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      unique_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      rows: {
        type: DataTypes.STRING
      },
      columns: {
        type: DataTypes.STRING
      },
      header_types: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      header_texts: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      second_row_headers: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      cell_texts: {
        type: DataTypes.ARRAY(DataTypes.ARRAY(DataTypes.STRING)),
      }
    },
    {
      sequelize,
      modelName: 'first_from_table',
    }
  );

  first_from_table.associate = function (models) {

    first_from_table.belongsTo(models.master_from_table, {
      as: "master_from_table",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "master_from_table_id"
    });

  };

  return first_from_table;
};