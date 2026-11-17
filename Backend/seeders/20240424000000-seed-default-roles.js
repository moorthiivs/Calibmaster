'use strict';
const { DEFAULT_ROLES } = require('../utils/default-roles');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Fetch all Labs
      const [labs] = await queryInterface.sequelize.query(
        'SELECT lab_id, lab_name FROM "Labs"',
        { transaction }
      );

      console.log(`[Seed] Found ${labs.length} labs to seed.`);

      const hashedPassword = await bcrypt.hash('password123', 12);

      for (const lab of labs) {
        console.log(`[Seed] Processing Lab: ${lab.lab_name} (ID: ${lab.lab_id})`);
        for (const roleDef of DEFAULT_ROLES) {
          // A. Role Handling
          let roleId;
          const [existingRoles] = await queryInterface.sequelize.query(
            'SELECT id FROM roles WHERE name = :name AND lab_id = :lab_id LIMIT 1',
            {
              replacements: { name: roleDef.name, lab_id: lab.lab_id },
              transaction
            }
          );

          if (existingRoles.length === 0) {
            console.log(`[Seed] Creating role: ${roleDef.name}`);
            const [result] = await queryInterface.sequelize.query(
              `INSERT INTO roles (name, permissions, lab_id, "createdAt", "updatedAt", "bypassPermissions") 
               VALUES (:name, :permissions, :lab_id, :createdAt, :updatedAt, :bypassPermissions)
               RETURNING id`,
              {
                replacements: {
                  name: roleDef.name,
                  permissions: JSON.stringify(roleDef.permissions),
                  lab_id: lab.lab_id,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  bypassPermissions: roleDef.name.toLowerCase() === 'admin'
                },
                transaction
              }
            );
            roleId = result[0].id;
          } else {
            roleId = existingRoles[0].id;
            console.log(`[Seed] Role ${roleDef.name} already exists (ID: ${roleId}). Updating permissions...`);
            // Update permissions JSON column
            await queryInterface.sequelize.query(
              `UPDATE roles SET permissions = :permissions, "updatedAt" = :updatedAt WHERE id = :id`,
              {
                replacements: {
                  id: roleId,
                  permissions: JSON.stringify(roleDef.permissions),
                  updatedAt: new Date()
                },
                transaction
              }
            );
          }

          // B. Role Permissions Handling (Junction Table)
          // Clear existing and re-insert to ensure sync
          await queryInterface.sequelize.query(
            'DELETE FROM role_permissions WHERE role_id = :role_id',
            { replacements: { role_id: roleId }, transaction }
          );

          console.log(`[Seed] Inserting ${roleDef.permissions.length} permissions for role ${roleDef.name}`);
          for (const perm of roleDef.permissions) {
            await queryInterface.sequelize.query(
              'INSERT INTO role_permissions (role_id, permission_key, "createdAt", "updatedAt") VALUES (:role_id, :permission_key, :createdAt, :updatedAt)',
              {
                replacements: {
                  role_id: roleId,
                  permission_key: perm,
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                transaction
              }
            );
          }

          // C. User Creation Handling
          const userEmail = `${roleDef.name.toLowerCase().replace(/\s+/g, '')}_${lab.lab_id}@calibmaster.com`;
          const [existingUsers] = await queryInterface.sequelize.query(
            'SELECT id FROM "Users" WHERE email = :email LIMIT 1',
            { replacements: { email: userEmail }, transaction }
          );

          if (existingUsers.length === 0) {
            console.log(`[Seed] Creating test user: ${userEmail}`);
            await queryInterface.sequelize.query(
              `INSERT INTO "Users" (name, email, password, department, rstatus, "labId", "roleId", "createdAt", "updatedAt", calibmaster_client_id) 
               VALUES (:name, :email, :password, :department, :rstatus, :labId, :roleId, :createdAt, :updatedAt, :calibmaster_client_id)`,
              {
                replacements: {
                  name: roleDef.name,
                  email: userEmail,
                  password: hashedPassword,
                  department: roleDef.name.toLowerCase() === 'admin' ? 'admin' : 'Staff',
                  rstatus: 1,
                  labId: lab.lab_id,
                  roleId: roleId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  calibmaster_client_id: new Date().getTime()
                },
                transaction
              }
            );
          } else {
            console.log(`[Seed] Test user ${userEmail} already exists.`);
          }
        }
      }

      await transaction.commit();
      console.log('[Seed] Seeding completed successfully.');
    } catch (err) {
      if (transaction) await transaction.rollback();
      console.error('[Seed] Seeding failed:', err);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Delete test users
      await queryInterface.sequelize.query(
        'DELETE FROM "Users" WHERE email LIKE \'%@calibmaster.com\'',
        { transaction }
      );
      
      // Delete seeded roles (this will cascade to role_permissions)
      // We identify them by the names in DEFAULT_ROLES
      const roleNames = DEFAULT_ROLES.map(r => r.name);
      await queryInterface.sequelize.query(
        'DELETE FROM roles WHERE name IN (:roleNames)',
        { replacements: { roleNames }, transaction }
      );

      await transaction.commit();
      console.log('[Seed] Rollback completed successfully.');
    } catch (err) {
      if (transaction) await transaction.rollback();
      console.error('[Seed] Rollback failed:', err);
      throw err;
    }
  }
};
