'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class cmssettings_permissions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  cmssettings_permissions.init(
    {
      cmssetting_permission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      setting_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
        defaultValue: 'ENABLE_CERTIFICATE_GENERATION'
      },

      setting_lable: {
        type: DataTypes.STRING(200),
        allowNull: true,
        defaultValue: 'Enable Certificate Generation'
      },

      setting_description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'This setting is used display'
      },

      setting_value: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: 'NO'
      },

      is_enable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'cmssettings_permissions',
    }
  );

  cmssettings_permissions.associate = function (models) {
    cmssettings_permissions.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id",
    });
  };

  return cmssettings_permissions;
};