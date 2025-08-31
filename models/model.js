'use strict';
module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define('Model', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        labId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdBy: {
            type: DataTypes.STRING,
            allowNull: true
        },
        updatedBy: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'Models',
        timestamps: true
    });

    return Model;
};
