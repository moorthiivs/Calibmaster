const jwt = require("jsonwebtoken");
const { errorHandler } = require("../helpers/error-handler");
const config = require("../utils/config");

// ── In-memory permission cache (TTL: 60 seconds) ────────────────────────────
// Key: userId | Value: { permissions, labId, department, bypassPermissions, expiresAt }
const permissionCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const getCachedPermissions = (userId) => {
  const entry = permissionCache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    permissionCache.delete(userId);
    return null;
  }
  return entry;
};

const setCachedPermissions = (userId, data) => {
  permissionCache.set(userId, { ...data, expiresAt: Date.now() + CACHE_TTL_MS });
};

// Call this when a user's role is updated to force fresh permissions on next request
const invalidatePermissionCache = (userId) => {
  permissionCache.delete(userId);
};

module.exports = (req, res, next) => {
  try {
    // ── Safe header access — prevents crash when header is absent ──
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("Unauthorized - Token not Found!!");
      error.code = 401;
      error.path = req.originalUrl;
      return errorHandler(error, req, res, next);
    }

    const token = authHeader.split(" ")[1];
    const sessionId = token.split(".")[2];
    const decodedToken = jwt.verify(token, config.TOKEN_SECRET);

    req.userId = decodedToken.userId;
    req.sessionId = sessionId;
    req.department = decodedToken.department;

    // ── Check permission cache first ──────────────────────────────
    const cached = getCachedPermissions(decodedToken.userId);
    if (cached) {
      req.labId = cached.labId;
      req.department = cached.department;
      req.permissions = cached.permissions;
      req.bypassPermissions = cached.bypassPermissions;
      return next();
    }

    // ── Cache miss — fetch from DB (using normalized junction table) ──
    const User = require("../models").User;
    const Role = require("../models").Role;
    const RolePermission = require("../models").RolePermission;

    User.findOne({
      where: { id: decodedToken.userId },
      include: [{
        model: Role,
        as: "role",
        include: [{
          // ✅ Load permissions from normalized junction table, not JSON column
          model: RolePermission,
          as: "rolePermissions",
          attributes: ["permission_key"],
        }],
      }],
    })
      .then((user) => {
        if (user) {
          req.labId = user.labId;
          req.department = user.department;

          let perms = [];
          if (user.role) {
            // ✅ Pure DB-driven: permissions come entirely from the junction table
            // (set by admin in the Create/Edit Role UI — no hardcoded rules)
            if (user.role.rolePermissions && user.role.rolePermissions.length > 0) {
              perms = user.role.rolePermissions.map(rp => rp.permission_key);
            } else if (user.role.permissions && user.role.permissions.length > 0) {
              // Fallback: JSON column (for roles not yet saved via new controller)
              perms = [...user.role.permissions];
            }
          }
          req.permissions = [...new Set(perms)];
          req.bypassPermissions = user.role ? (user.role.bypassPermissions === true) : false;

          // Cache for next 60 seconds
          setCachedPermissions(decodedToken.userId, {
            labId: user.labId,
            department: user.department,
            permissions: req.permissions,
            bypassPermissions: req.bypassPermissions,
          });
        }
        next();
      })
      .catch((err) => {
        console.error("[check-auth] DB error:", err);
        next(); // allow request to proceed; checkPermission will deny if needed
      });

  } catch (err) {
    const error = new Error("Error while Decoding Token!!");
    error.code = 401;
    error.path = req.originalUrl;
    return errorHandler(error, req, res, next);
  }
};

// Export cache invalidation so roles-controller can call it on role update
module.exports.invalidatePermissionCache = invalidatePermissionCache;
