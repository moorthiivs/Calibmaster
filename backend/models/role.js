'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.belongsTo(models.Lab, {
        as: 'lab',
        foreignKey: 'lab_id',
        onDelete: 'CASCADE',
      });
      Role.hasMany(models.User, {
        as: 'users',
        foreignKey: 'roleId',
      });
      // Junction table: one row per permission key per role
      Role.hasMany(models.RolePermission, {
        as: 'rolePermissions',
        foreignKey: 'role_id',
        onDelete: 'CASCADE',
      });
    }
  }

  Role.init({
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
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    bypassPermissions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "If true, this role bypasses all permission checks (replaces hardcoded admin bypass)"
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "userId of the user who created this role"
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "userId of the user who last updated this role"
    },
    lab_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Labs', // assuming Lab table is 'Labs'
        key: 'lab_id'
      }
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
  });

  return Role;
};
