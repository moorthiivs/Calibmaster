'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Fetch all distinct Lab IDs
      const [labs] = await queryInterface.sequelize.query(
        'SELECT lab_id FROM "Labs"',
        { transaction }
      );

      // Define default roles and their permissions based on old departments
      const defaultRolesDef = [
        {
          name: 'admin',
          permissions: JSON.stringify([
            'ACCESS_CUSTOMERS', 'ACCESS_USERS', 'ACCESS_UOM', 'ACCESS_INSTRUMENTS',
            'ACCESS_MASTERS', 'ACCESS_PROCEDURES', 'ACCESS_ULR', 'ACCESS_SRF',
            'CREATE_SRF', 'ACCESS_REPORTS', 'ACCESS_DUE_DATE', 'ACCESS_SETTINGS',
            'ACCESS_QUOTATIONS', 'ACTION_EDIT_SRF_ITEM', 'ACTION_DELETE_SRF_ITEM',
            'ACTION_ENTER_RESULT', 'ACTION_UPLOAD_CERTIFICATE', 'ACTION_DELIVERY_CHALLAN',
            'ACTION_GENERATE_LABEL'
          ])
        },
        {
          name: 'Manager',
          permissions: JSON.stringify([
            'ACCESS_CUSTOMERS', 'ACCESS_UOM', 'ACCESS_INSTRUMENTS',
            'ACCESS_MASTERS', 'ACCESS_PROCEDURES', 'ACCESS_ULR', 'ACCESS_SRF',
            'CREATE_SRF', 'ACCESS_REPORTS', 'ACCESS_DUE_DATE', 'ACCESS_SETTINGS',
            'ACCESS_QUOTATIONS', 'ACTION_EDIT_SRF_ITEM', 'ACTION_DELETE_SRF_ITEM',
            'ACTION_ENTER_RESULT', 'ACTION_UPLOAD_CERTIFICATE', 'ACTION_DELIVERY_CHALLAN',
            'ACTION_GENERATE_LABEL'
          ])
        },
        {
          name: 'Calibration',
          permissions: JSON.stringify([
            'ACCESS_ULR', 'ACCESS_SRF', 'ACCESS_SCANNER',
            'ACTION_ENTER_RESULT', 'ACTION_UPDATE_SRF_STATUS'
          ])
        },
        {
          name: 'CSD',
          permissions: JSON.stringify([
            'ACCESS_ULR', 'ACCESS_SRF', 'CREATE_SRF', 'ACCESS_REPORTS',
            'ACTION_EDIT_SRF_ITEM', 'ACTION_DELETE_SRF_ITEM', 'ACTION_UPLOAD_CERTIFICATE',
            'ACTION_DELIVERY_CHALLAN', 'ACTION_GENERATE_LABEL'
          ])
        },
        {
          name: 'Accounts',
          permissions: JSON.stringify([
            'ACCESS_SRF', 'ACCESS_QUOTATIONS'
          ])
        }
      ];

      // 2. Create roles for each Lab
      const roleMap = {}; // Format: { "lab_id-role_name": role_id }
      
      for (const lab of labs) {
        for (const roleDef of defaultRolesDef) {
          const createdAt = new Date();
          const updatedAt = new Date();
          
          await queryInterface.sequelize.query(
            `INSERT INTO roles (name, permissions, lab_id, "createdAt", "updatedAt") 
             VALUES (:name, :permissions, :lab_id, :createdAt, :updatedAt)`,
            {
              replacements: { 
                name: roleDef.name, 
                permissions: roleDef.permissions, 
                lab_id: lab.lab_id,
                createdAt,
                updatedAt
              },
              transaction
            }
          );

          // Get the inserted role ID
          const [insertedRoles] = await queryInterface.sequelize.query(
            `SELECT id FROM roles WHERE name = :name AND lab_id = :lab_id ORDER BY id DESC LIMIT 1`,
            {
              replacements: { name: roleDef.name, lab_id: lab.lab_id },
              transaction
            }
          );

          if (insertedRoles.length > 0) {
            roleMap[`${lab.lab_id}-${roleDef.name}`] = insertedRoles[0].id;
          }
        }
      }

      // 3. Update existing Users with roleId based on department
      const [users] = await queryInterface.sequelize.query(
        'SELECT id, department, "labId" FROM "Users"',
        { transaction }
      );

      for (const user of users) {
        let roleId = roleMap[`${user.labId}-${user.department}`];
        if (!roleId && user.department === 'root') {
          // Root user might not need a role, but we can assign admin for now, or create root role.
          // We will let root users bypass role checks in code.
          continue; 
        }

        if (roleId) {
          await queryInterface.sequelize.query(
            `UPDATE "Users" SET "roleId" = :roleId WHERE id = :userId`,
            {
              replacements: { roleId, userId: user.id },
              transaction
            }
          );
        }
      }

      // 4. Migrate employee_masters to Users
      const [employees] = await queryInterface.sequelize.query(
        'SELECT * FROM employee_masters',
        { transaction }
      );

      // Fix the Users sequence in case it is out of sync
      await queryInterface.sequelize.query(
        'SELECT setval(\'"Users_id_seq"\', COALESCE((SELECT MAX(id)+1 FROM "Users"), 1), false)',
        { transaction }
      );

      for (const emp of employees) {
        // Try to find an existing user with the same name and labId
        const [existingUsers] = await queryInterface.sequelize.query(
          `SELECT id FROM "Users" WHERE name = :name AND "labId" = :lab_id LIMIT 1`,
          {
            replacements: { name: emp.employee_full_name, lab_id: emp.lab_id },
            transaction
          }
        );

        if (existingUsers.length > 0) {
          // Update existing user with title and signature
          await queryInterface.sequelize.query(
            `UPDATE "Users" SET title = :title, signature = :signature WHERE id = :userId`,
            {
              replacements: { 
                title: emp.employee_title, 
                signature: emp.employee_signature,
                userId: existingUsers[0].id 
              },
              transaction
            }
          );
        } else {
          // Create new user for this employee
          let roleId = roleMap[`${emp.lab_id}-${emp.employee_role}`];
          if (!roleId) {
             // Default to Calibration if role not found
             roleId = roleMap[`${emp.lab_id}-Calibration`];
          }

          const hashedPassword = await bcrypt.hash('123456', 12);
          const email = `employee_${emp.employee_id}@migrated.local`;

          await queryInterface.sequelize.query(
            `INSERT INTO "Users" (name, email, password, department, rstatus, "labId", "roleId", title, signature, "createdAt", "updatedAt") 
             VALUES (:name, :email, :password, :department, :rstatus, :labId, :roleId, :title, :signature, :createdAt, :updatedAt)`,
            {
              replacements: {
                name: emp.employee_full_name,
                email: email,
                password: hashedPassword,
                department: emp.employee_role || 'Calibration',
                rstatus: emp.employee_enable == '1' ? 1 : 2,
                labId: emp.lab_id,
                roleId: roleId || null,
                title: emp.employee_title,
                signature: emp.employee_signature,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              transaction
            }
          );
        }
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    // Downgrade would clear roleId, titles, and signatures from Users, and truncate roles
    await queryInterface.sequelize.query('UPDATE "Users" SET "roleId" = NULL, title = NULL, signature = NULL');
    await queryInterface.sequelize.query('TRUNCATE TABLE roles CASCADE');
  }
};
