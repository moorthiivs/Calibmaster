const logger = require("../utils/logger");
const { PERMISSION_DEPENDENCIES } = require("../utils/permission-registry");

module.exports = (requiredPermission) => {
    return (req, res, next) => {
        const userId = req.userId || "unknown";
        const route = req.originalUrl || req.path;

        // Root has full access always
        if (req.department === "root") {
            req.permissionChecked = true;
            return next();
        }

        // Check DB-level bypassPermissions flag (set on Role model)
        if (req.bypassPermissions === true) {
            req.permissionChecked = true;
            return next();
        }

        // Legacy fallback: admin department still bypasses UNLESS it's a ROOT_ONLY permission
        const ROOT_ONLY_PERMISSIONS = [
            "ACCESS_USER_TRACK",
            "MANAGE_LABS",
            "SYNC_DATA"
        ];

        if (req.department === "admin") {
            if (ROOT_ONLY_PERMISSIONS.includes(requiredPermission)) {
                logger.warn(`[403] BLOCKED | userId=${userId} | route=${route} | required=${requiredPermission} | reason=ROOT_ONLY | department=admin`);
                return res.status(403).json({
                    code: 403,
                    message: "Access Denied: This resource is restricted to Root users only."
                });
            }
            req.permissionChecked = true;
            return next();
        }

        // Standard permission check for regular users
        const userPermissions = req.permissions || [];
        const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

        // Expand the user's permission set with implicit dependencies from the central registry
        const expandedPermissions = new Set(userPermissions);
        userPermissions.forEach(p => {
            if (PERMISSION_DEPENDENCIES[p]) {
                PERMISSION_DEPENDENCIES[p].forEach(dep => {
                    const depPerm = typeof dep === 'string' ? dep : dep.perm;
                    expandedPermissions.add(depPerm);
                });
            }
        });

        // Check if any of the required permissions (or their parents) are in the expanded set
        if (required.some(p => expandedPermissions.has(p))) {
            req.permissionChecked = true;
            return next();
        }

        // Denied — log for audit trail
        logger.warn(`[403] BLOCKED | userId=${userId} | route=${route} | required=${requiredPermission} | department=${req.department || "none"}`);
        return res.status(403).json({
            code: 403,
            message: "Access Denied: You do not have permission to perform this action."
        });
    };
};
