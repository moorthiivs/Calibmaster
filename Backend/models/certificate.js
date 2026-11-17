"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {

  const Certificate = sequelize.define("Certificate", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    observationFileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    draftFileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rstatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  });

  Certificate.associate = function (models) {
    Certificate.belongsTo(models.srfitem, {
      as: "srfitem",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "srfitemId",
    });
  };

  return Certificate;
};
