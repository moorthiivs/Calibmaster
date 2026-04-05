"use strict";
module.exports = (sequelize, DataTypes) => {
  const Masterlist = sequelize.define("Masterlist", {
    // Model attributes are defined here
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    units: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    rstatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  Masterlist.associate = function (models) {
    // define association here
    Masterlist.belongsTo(models.Lab, {
      as: "lab",
      foreignKey: "labId",
      constrains: true,
      onDelete: "CASCADE",
    });
  };
  return Masterlist;
};
