'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AssignLabSequence extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AssignLabSequence.init({
    firstName: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AssignLabSequence',
  });
  return AssignLabSequence;
};