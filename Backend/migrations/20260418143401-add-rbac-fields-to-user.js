'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'roleId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Users', 'title', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'signature', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'roleId');
    await queryInterface.removeColumn('Users', 'title');
    await queryInterface.removeColumn('Users', 'signature');
  }
};
