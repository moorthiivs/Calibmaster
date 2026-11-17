'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RolePermission extends Model {
    static associate(models) {
      RolePermission.belongsTo(models.Role, {
        as: 'role',
        foreignKey: 'role_id',
        onDelete: 'CASCADE',
      });
    }
  }

  RolePermission.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    permission_key: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Permission constant e.g. CREATE_CUSTOMER, LIST_SRF, EDIT_UOM',
    },
  }, {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_key'],
        name: 'uq_role_permission',
      },
    ],
  });

  return RolePermission;
};
