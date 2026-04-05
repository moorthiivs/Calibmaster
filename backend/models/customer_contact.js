'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class customer_contact extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  customer_contact.init(
    {
      customer_contact_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },

      contact_title: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      contact_fullname: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },

      contact_email: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      contact_phone_1: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      contact_phone_2: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },

      rstatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      created_timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      created_by_login_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      created_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      updated_timestamp: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_by_login_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      updated_by_user_id: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'customer_contact',
      timestamps: false,
    }
  );

  customer_contact.associate = function (models) {
    customer_contact.belongsTo(models.customer, {
      as: "customer",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "customer_id",
    });
  };

  return customer_contact;
};