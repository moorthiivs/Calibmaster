'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class result_table extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  result_table.init(
    {
      result_table_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },

      fromId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      unique_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      table_type: {
        type: DataTypes.STRING,
        allowNull: false
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
        type: DataTypes.JSON
      },
      print_on_certifcate: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NO'
      },
      procedure_image_filename: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      },
      conditional_formats: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
      }
    },
    {
      sequelize,
      modelName: 'result_table',
    }
  );

  result_table.associate = function (models) {

    result_table.belongsTo(models.master_result_table, {
      as: "master_result_tables",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "master_result_table_id"
    });

  };

  return result_table;
};