'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class MasterListEquipment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  MasterListEquipment.init(
    {
      master_list_equipment_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },

      asset_identification_no: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      equipment_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      equipment_make_or_nodel: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      equipment_serial_no: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      range_size: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      least_count: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accuracy_or_acceptance: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      year_of_purchase: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      calibrated_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      date_of_calibration: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      calibration_due_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      calibration_certificate_no: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      uncertainty: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      frequency_of_calibration: {
        type: DataTypes.STRING,
        allowNull: false,
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
      },
    },
    {
      sequelize,
      modelName: 'MasterListEquipment',
      timestamps: false
    }
  );

  MasterListEquipment.associate = function (models) {

    MasterListEquipment.belongsTo(models.Lab, {
      as: "lab",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "lab_id",
    });
  };
  return MasterListEquipment;
};