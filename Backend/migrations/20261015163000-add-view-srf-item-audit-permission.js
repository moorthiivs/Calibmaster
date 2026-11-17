'use strict';

/**
 * Migration: Add VIEW_SRF_ITEM_AUDIT permission to all roles that have VIEW_SRF_ITEM
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const viewItemPerms = await queryInterface.sequelize.query(
      `SELECT DISTINCT role_id FROM role_permissions WHERE permission_key = 'VIEW_SRF_ITEM'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (viewItemPerms && viewItemPerms.length > 0) {
      const rows = viewItemPerms.map(r => ({
        role_id: r.role_id,
        permission_key: 'VIEW_SRF_ITEM_AUDIT',
        createdAt: now,
        updatedAt: now
      }));

      await queryInterface.bulkInsert('role_permissions', rows, {
        ignoreDuplicates: true
      });
    }

    const roles = await queryInterface.sequelize.query(
      `SELECT id, permissions FROM roles WHERE permissions IS NOT NULL`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const role of roles) {
      let perms = role.permissions;
      if (typeof perms === 'string') {
        try { perms = JSON.parse(perms); } catch { perms = []; }
      }
      if (Array.isArray(perms) && perms.includes('VIEW_SRF_ITEM') && !perms.includes('VIEW_SRF_ITEM_AUDIT')) {
        perms.push('VIEW_SRF_ITEM_AUDIT');
        await queryInterface.sequelize.query(
          `UPDATE roles SET permissions = :perms, "updatedAt" = :now WHERE id = :id`,
          {
            replacements: {
              perms: JSON.stringify(perms),
              now,
              id: role.id
            }
          }
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('role_permissions', { permission_key: 'VIEW_SRF_ITEM_AUDIT' });
  }
};
