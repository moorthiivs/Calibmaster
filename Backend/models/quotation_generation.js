'use strict';

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {

    class quotationGeneration extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    quotationGeneration.init({
        quotation_detail_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        customer_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customer_company_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customer_Contact_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customer_email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        quotation_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        quotation_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        quotation_items: {
            type: DataTypes.ARRAY(DataTypes.JSON),
            allowNull: false
        },
        other_charges: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        notes: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true
        },
        quotation_filename: {
            type: DataTypes.STRING,
            allowNull: true
        },
    },
        {
            sequelize,
            modelName: 'quotation_generation',
            timestamps: false,
        }
    )

    quotationGeneration.associate = function (models) {
        quotationGeneration.belongsTo(models.Lab, {
            as: "lab",
            constraints: true,
            onDelete: "CASCADE",
            foreignKey: "lab_id"
        });


        quotationGeneration.hasOne(models.quotation_customer_contact, {
            as: "quotation_customer_contact",
            constraints: true,
            onDelete: "CASCADE",
            foreignKey: "quotation_customer_id"
        })
    }
    return quotationGeneration;

}