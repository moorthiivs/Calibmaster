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

      standard_maintained: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      name_of_equipment: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      uid: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      type_of_facility: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      make: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      model_type: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      year_Of_make: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      serial_no: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      asset_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      receipt_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      date_placed_in_service: {
        type: DataTypes.DATE,
        allowNull: false
      },
      range: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      least_Count: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      least_product_tolerance: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      accuracy: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      uncertainty: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      history_card_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      date_of_last_calibration_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      calibration_certificate_no: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      calibration_frequency: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      calibration_agency: {
        type: DataTypes.STRING(300),
        allowNull: false,
      },
      calibrated_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      equipment_status: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      traceability: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      next_calibration_reminder: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      calibration_valid_upto: {
        type: DataTypes.DATE,
        allowNull: false
      },
      calibration_remainder_date_1: {
        type: DataTypes.DATE,
        allowNull: true
      },
      calibration_remainder_date_2: {
        type: DataTypes.DATE,
        allowNull: true
      },
      electro_parameter: {
        type: DataTypes.JSON,
        allowNull: true
      },
      remark: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
      mastercertificate_filename: {
        type: DataTypes.STRING,
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

    MasterListEquipment.belongsTo(models.instrument_discipline, {
      as: "discipline",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "instrument_discipline_id"
    });

    MasterListEquipment.belongsTo(models.instrument_groups, {
      as: "group",
      constrains: true,
      onDelete: "CASCADE",
      foreignKey: "instrument_group_id"
    });

  };
  return MasterListEquipment;
};