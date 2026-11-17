'use strict';
const bcrypt = require('bcryptjs');
const { DEFAULT_ROLES } = require('../utils/default-roles');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Ensure Roles exist for each Lab (Idempotent)
      const [labs] = await queryInterface.sequelize.query('SELECT lab_id FROM "Labs"', { transaction });
      const roleMap = {}; // Format: { "lab_id-role_name": role_id }

      for (const lab of labs) {
        for (const roleDef of DEFAULT_ROLES) {
          // Check if role exists
          const [existingRoles] = await queryInterface.sequelize.query(
            'SELECT id FROM roles WHERE name = :name AND lab_id = :lab_id LIMIT 1',
            {
              replacements: { name: roleDef.name, lab_id: lab.lab_id },
              transaction
            }
          );

          let roleId;
          if (existingRoles.length === 0) {
            await queryInterface.sequelize.query(
              `INSERT INTO roles (name, permissions, lab_id, "createdAt", "updatedAt") 
               VALUES (:name, :permissions, :lab_id, :createdAt, :updatedAt)`,
              {
                replacements: {
                  name: roleDef.name,
                  permissions: JSON.stringify(roleDef.permissions),
                  lab_id: lab.lab_id,
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                transaction
              }
            );
            const [newRole] = await queryInterface.sequelize.query(
              'SELECT id FROM roles WHERE name = :name AND lab_id = :lab_id ORDER BY id DESC LIMIT 1',
              { replacements: { name: roleDef.name, lab_id: lab.lab_id }, transaction }
            );
            roleId = newRole[0].id;
          } else {
            roleId = existingRoles[0].id;
          }
          roleMap[`${lab.lab_id}-${roleDef.name}`] = roleId;
        }
      }

      // 2. Map existing Users to Roles (if not already mapped)
      const [users] = await queryInterface.sequelize.query('SELECT id, department, "labId", "roleId" FROM "Users"', { transaction });
      for (const user of users) {
        if (!user.roleId && user.department !== 'root') {
          const roleId = roleMap[`${user.labId}-${user.department}`];
          if (roleId) {
            await queryInterface.sequelize.query(
              'UPDATE "Users" SET "roleId" = :roleId WHERE id = :userId',
              { replacements: { roleId, userId: user.id }, transaction }
            );
          }
        }
      }

      // 3. Migrate Employees to Users
      const [employees] = await queryInterface.sequelize.query('SELECT * FROM employee_masters', { transaction });
      
      // Fix sequence
      await queryInterface.sequelize.query(
        'SELECT setval(\'"Users_id_seq"\', COALESCE((SELECT MAX(id)+1 FROM "Users"), 1), false)',
        { transaction }
      );

      for (const emp of employees) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM "Users" WHERE name = :name AND "labId" = :labId LIMIT 1',
          { replacements: { name: emp.employee_full_name, labId: emp.lab_id }, transaction }
        );

        if (existing.length > 0) {
          // Update existing
          await queryInterface.sequelize.query(
            'UPDATE "Users" SET title = :title, signature = :signature, department = COALESCE(department, :role) WHERE id = :id',
            {
              replacements: {
                id: existing[0].id,
                title: emp.employee_title,
                signature: emp.employee_signature,
                role: emp.employee_role || 'Calibration'
              },
              transaction
            }
          );
        } else {
          // Create new
          const roleId = roleMap[`${emp.lab_id}-${emp.employee_role}`] || roleMap[`${emp.lab_id}-Calibration`];
          const hashedPassword = await bcrypt.hash('123456', 12);
          const email = `employee_${emp.employee_id}@migrated.local`;

          await queryInterface.sequelize.query(
            `INSERT INTO "Users" (name, email, password, department, rstatus, "labId", "roleId", title, signature, "createdAt", "updatedAt") 
             VALUES (:name, :email, :password, :dept, :rstatus, :labId, :roleId, :title, :signature, :now, :now)`,
            {
              replacements: {
                name: emp.employee_full_name,
                email,
                password: hashedPassword,
                dept: emp.employee_role || 'Calibration',
                rstatus: emp.employee_enable == '1' ? 1 : 2,
                labId: emp.lab_id,
                roleId: roleId || null,
                title: emp.employee_title,
                signature: emp.employee_signature,
                now: new Date()
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
    // Standard rollback behavior
  }
};
