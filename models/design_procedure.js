'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class design_procedure extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  design_procedure.init(
    {
      design_procedure_id: {
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
      table_type: {
        type: DataTypes.STRING,
        allowNull: false
      },

      rows: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      columns: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      header_types: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      header_texts: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      second_row_headers: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
      cell_texts: {
        type: DataTypes.ARRAY(DataTypes.ARRAY(DataTypes.STRING)),
        allowNull: false,
      },

    },
    {
      sequelize,
      modelName: 'design_procedure',
    }
  );

  design_procedure.associate = function (models) {

    design_procedure.belongsTo(models.master_design_procedure, {
      as: "master_design_procedure",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "master_design_procedure_id"
    });

  };

  return design_procedure;
};