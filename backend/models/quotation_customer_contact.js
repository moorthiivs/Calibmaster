'use strict';


const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {

    class quotation_customer_contact extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    quotation_customer_contact.init({
        quotation_customer_id: {
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
        customer_address_1: {
            type: DataTypes.STRING,
            allowNull: false
        },
        customer_address_2: {
            type: DataTypes.STRING,
            allowNull: false
        },
        customer_address_3: {
            type: DataTypes.STRING,
            allowNull: false
        },
        customer_city: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customer_state: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        customer_pincode: {
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
        }
    },
        {
            sequelize,
            modelName: 'quotation_customer_contact',
            timestamps: false,
        }
    )

    quotation_customer_contact.associate = function (models) {
        quotation_customer_contact.belongsTo(models.quotation_generation, {
            as: "quotation_generation",
            constraints: true,
            onDelete: "CASCADE",
            foreignKey: "quotation_detail_id"
        });




    }
    return quotation_customer_contact;

}