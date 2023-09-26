"use strict";
const User = require("../models").User;
const bcrypt = require("bcryptjs");
const config = require("../utils/config");
const logger = require("../utils/logger");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    let adminExists;
    try {
      adminExists = await User.findOne({ where: { department: "root" } });
    } catch (err) {
      logger.error("Admin User Creation Failed!!" + err);
    }
    let hashedPassword;
    if (!adminExists) {
      try {
        hashedPassword = await bcrypt.hash(config.ADMIN_PASSWORD, 12);
      } catch (err) {
        logger.error("Admin Password Encryption Failed!!");
      }
      //console.log(hashedPassword);
      const adminUser = new User({
        id: 0,
        name: "Super User",
        email: "root@iviewsense.com",
        password: hashedPassword,
        department: "root",
        rstatus: 1,
        //labId: 1,
      });
      try {
        const result1 = await adminUser.save();
        logger.info("Admin User Created");
      } catch (err) {
        console.log(err);
        logger.error("Admin User Creation Failed!!");
      }

      /**
       * Add seed commands here.
       *
       * Example:
       * await queryInterface.bulkInsert('People', [{
       *   name: 'John Doe',
       *   isBetaMember: false
       * }], {});
       */
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("Users", null, {});
  },
};
