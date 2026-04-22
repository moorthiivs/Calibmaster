const Role = require("../models").Role;
const RolePermission = require("../models").RolePermission;
const User = require("../models").User;
const { errorHandler } = require("../helpers/error-handler");
const { invalidatePermissionCache } = require("../middleware/check-auth");

// ── Helper: load role with permissions from junction table ──────────────────
const loadRoleWithPermissions = async (where) => {
  const role = await Role.findOne({
    where,
    include: [{ model: RolePermission, as: 'rolePermissions', attributes: ['permission_key'] }],
  });
  if (!role) return null;
  // Shape: attach a plain `permissions` array for frontend compatibility
  const plain = role.toJSON();
  plain.permissions = plain.rolePermissions.map(rp => rp.permission_key);
  delete plain.rolePermissions;
  return plain;
};

// ── list ────────────────────────────────────────────────────────────────────
const list = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      where: { lab_id: req.body.labId || req.labId },
      include: [{ model: RolePermission, as: 'rolePermissions', attributes: ['permission_key'] }],
      order: [['id', 'ASC']],
    });

    // Map each role to include a flat `permissions` array (backward-compatible)
    const result = roles.map(role => {
      const r = role.toJSON();
      r.permissions = r.rolePermissions.map(rp => rp.permission_key);
      delete r.rolePermissions;
      return r;
    });

    return res.json({ status: "SUCCESS", code: 200, data: result });
  } catch (err) {
    console.error('[roles] list error:', err);
    return errorHandler(new Error("Internal Server Error"), req, res, next);
  }
};

// ── create ──────────────────────────────────────────────────────────────────
const create = async (req, res, next) => {
  try {
    const { name, description, permissions = [], labId } = req.body;

    // 1. Create the Role row
    const newRole = await Role.create({
      name,
      description,
      permissions,           // Keep JSON column in sync during transition
      lab_id: labId || req.labId,
      bypassPermissions: false,
      createdBy: req.userId,
      updatedBy: req.userId,
    });

    // 2. Insert into junction table
    if (permissions.length > 0) {
      const rows = [...new Set(permissions)].map(key => ({
        role_id: newRole.id,
        permission_key: key,
      }));
      await RolePermission.bulkCreate(rows, { ignoreDuplicates: true });
    }

    return res.json({ status: "SUCCESS", code: 200, message: "Role Created Successfully" });
  } catch (err) {
    console.error('[roles] create error:', err);
    return errorHandler(new Error("Internal Server Error"), req, res, next);
  }
};

// ── update ──────────────────────────────────────────────────────────────────
const update = async (req, res, next) => {
  try {
    const { id, name, description, permissions = [], labId, bypassPermissions } = req.body;

    const role = await Role.findOne({ where: { id, lab_id: labId || req.labId } });
    if (!role) {
      const err = new Error("Role Not Found");
      err.code = 404;
      return errorHandler(err, req, res, next);
    }

    // 1. Update role metadata + keep JSON column in sync
    await role.update({
      name,
      description,
      permissions,           // Keep JSON column in sync during transition
      bypassPermissions: bypassPermissions === true,
      updatedBy: req.userId,
    });

    // 2. Replace junction table rows: delete old → insert new
    await RolePermission.destroy({ where: { role_id: id } });
    if (permissions.length > 0) {
      const rows = [...new Set(permissions)].map(key => ({
        role_id: id,
        permission_key: key,
      }));
      await RolePermission.bulkCreate(rows, { ignoreDuplicates: true });
    }

    // 3. Invalidate permission cache for all users assigned to this role
    const usersWithRole = await User.findAll({ where: { roleId: id } });
    usersWithRole.forEach(u => invalidatePermissionCache(u.id));

    return res.json({ status: "SUCCESS", code: 200, message: "Role Updated Successfully" });
  } catch (err) {
    console.error('[roles] update error:', err);
    return errorHandler(new Error("Internal Server Error"), req, res, next);
  }
};

// ── remove ──────────────────────────────────────────────────────────────────
const remove = async (req, res, next) => {
  try {
    const { id, labId } = req.body;

    const role = await Role.findOne({ where: { id, lab_id: labId || req.labId } });
    if (!role) {
      const err = new Error("Role Not Found");
      err.code = 404;
      return errorHandler(err, req, res, next);
    }

    // Safety check: block delete if users are assigned to this role
    const assignedUserCount = await User.count({ where: { roleId: id } });
    if (assignedUserCount > 0) {
      const err = new Error(
        `Cannot delete this role — ${assignedUserCount} user${assignedUserCount > 1 ? "s are" : " is"} currently assigned to it. Reassign them first.`
      );
      err.code = 409;
      return errorHandler(err, req, res, next);
    }

    // CASCADE delete handles role_permissions cleanup automatically
    await role.destroy();

    return res.json({ status: "SUCCESS", code: 200, message: "Role Deleted Successfully" });
  } catch (err) {
    console.error('[roles] remove error:', err);
    return errorHandler(new Error("Internal Server Error"), req, res, next);
  }
};

// ── getPermissionsForRole — utility for direct permission queries ─────────
// Example: find all roles that have CREATE_CUSTOMER permission (DB-level query)
const getRolesWithPermission = async (req, res, next) => {
  try {
    const { permission_key } = req.body;
    if (!permission_key) {
      const err = new Error("permission_key is required");
      err.code = 400;
      return errorHandler(err, req, res, next);
    }

    const rolePermissions = await RolePermission.findAll({
      where: { permission_key },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }],
    });

    const roles = rolePermissions.map(rp => rp.role).filter(Boolean);
    return res.json({ status: "SUCCESS", code: 200, data: roles });
  } catch (err) {
    console.error('[roles] getRolesWithPermission error:', err);
    return errorHandler(new Error("Internal Server Error"), req, res, next);
  }
};

module.exports = {
  list,
  create,
  update,
  remove,
  getRolesWithPermission,
};
