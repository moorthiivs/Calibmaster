'use strict';

/**
 * Data Migration: Seed role_permissions from roles.permissions JSON column
 *
 * Reads every role's permissions JSON array and inserts one row per
 * permission key into the new role_permissions junction table.
 * Skips duplicates (in case migration is run twice accidentally).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch all roles with their existing JSON permissions array
    const roles = await queryInterface.sequelize.query(
      'SELECT id, permissions FROM roles WHERE permissions IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const now = new Date();
    const rows = [];

    for (const role of roles) {
      let perms = role.permissions;

      // PostgreSQL returns JSON columns already parsed; handle both string and array
      if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch { perms = []; }
      }
      if (!Array.isArray(perms)) continue;

      for (const permKey of perms) {
        if (typeof permKey === 'string' && permKey.trim()) {
          rows.push({
            role_id: role.id,
            permission_key: permKey.trim(),
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    if (rows.length > 0) {
      // Use bulkInsert with ignoreDuplicates to safely re-run
      await queryInterface.bulkInsert('role_permissions', rows, {
        ignoreDuplicates: true, // PostgreSQL: ON CONFLICT DO NOTHING
      });
      console.log(`[migration] Seeded ${rows.length} permission rows from ${roles.length} roles.`);
    } else {
      console.log('[migration] No existing permissions to migrate.');
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove all seeded rows — recreating the JSON was not lost (column still exists)
    await queryInterface.bulkDelete('role_permissions', null, {});
  }
};
