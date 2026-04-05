'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("srfitems", "calibration_due_date", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("srfitems", "calibration_remainder_date_1", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("srfitems", "calibration_remainder_date_2", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("srfitems", "calibration_remainder_date_3", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("srfitems", "calibration_remainder_date_4", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("srfitems", "calibration_remainder_date_5", {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn("srfitems", "calibration_due_date");
    await queryInterface.removeColumn("srfitems", "calibration_remainder_date_1");
    await queryInterface.removeColumn("srfitems", "calibration_remainder_date_2");
    await queryInterface.removeColumn("srfitems", "calibration_remainder_date_3");
    await queryInterface.removeColumn("srfitems", "calibration_remainder_date_4");
    await queryInterface.removeColumn("srfitems", "calibration_remainder_date_5");
  }
};
