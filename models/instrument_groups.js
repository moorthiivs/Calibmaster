'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {

  class instrument_groups extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  instrument_groups.init(
    {
      instrument_group_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      group_details: {
        type: DataTypes.STRING,
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: 'instrument_groups',
      timestamps: false
    }
  );

  instrument_groups.associate = function (models) {

    instrument_groups.belongsTo(models.instrument_discipline, {
      as: "discipline",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "instrument_discipline_id"
    });

  };

  return instrument_groups;
};