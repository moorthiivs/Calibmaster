const logger = require("../utils/logger");

module.exports = (requiredPermission) => {
    return (req, res, next) => {
        const userId = req.userId || "unknown";
        const route = req.originalUrl || req.path;

        // Root has full access always
        if (req.department && req.department.toLowerCase() === "root") {
            req.permissionChecked = true;
            return next();
        }

        // Check DB-level bypassPermissions flag (set on Role model)
        // If the role has bypassPermissions = true, skip permission checks (replaces hardcoded admin bypass)
        if (req.bypassPermissions === true) {
            req.permissionChecked = true;
            return next();
        }

        // Legacy fallback: admin department still bypasses UNLESS it's a ROOT_ONLY permission
        // This will be removed once all roles are migrated to use bypassPermissions flag
        const ROOT_ONLY_PERMISSIONS = [
            "ACCESS_USER_TRACK",
            "MANAGE_LABS",
            "SYNC_DATA"
        ];

        if (req.department && req.department.toLowerCase() === "admin") {
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
        
        if (required.some(p => userPermissions.includes(p))) {
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
