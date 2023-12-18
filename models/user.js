"use strict";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rstatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    calibmaster_client_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  });

  User.associate = function (models) {
    User.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "labId",
    });
  };

  return User;
};
