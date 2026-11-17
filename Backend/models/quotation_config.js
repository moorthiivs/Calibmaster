'use strict';
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {

    class quotation_config extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    quotation_config.init({
        quotation_config_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        GST_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        PAN_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Bank_account_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        Bank_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        branch: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        IFSC_code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        HSN_SAC: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Lab_Short_Name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Quotation_Short_Name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Current_Financial_Year: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Running_Quotation_Number: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        GST_Percentage: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        Actual_Running_Quotation_Number: {
            type: DataTypes.STRING,
            allowNull: false
        }

    },
        {
            sequelize,
            modelName: 'quotation_config',
            timestamps: false,
        }
    )
    quotation_config.associate = function (models) {
        quotation_config.belongsTo(models.Lab, {
            as: "lab",
            constraints: true,
            onDelete: "CASCADE",
            foreignKey: "lab_id"
        })
    }
    return quotation_config;
}