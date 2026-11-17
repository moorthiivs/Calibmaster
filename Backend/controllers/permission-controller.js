const { PERMISSIONS_GROUPS, PERMISSION_DESCRIPTIONS, PERMISSION_DEPENDENCIES } = require("../utils/permission-registry");

exports.getPermissionSchema = (req, res) => {
    try {
        res.status(200).json({
            status: "SUCCESS",
            code: 200,
            data: {
                groups: PERMISSIONS_GROUPS,
                descriptions: PERMISSION_DESCRIPTIONS,
                dependencies: PERMISSION_DEPENDENCIES
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILURE",
            code: 500,
            message: "Failed to fetch permission schema"
        });
    }
};
