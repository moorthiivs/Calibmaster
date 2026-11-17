import React from "react";
import { usePermissions } from "../../hooks/usePermissions";
import UnauthorizedPage from "../BodyContent/UnauthorizedPage";

/**
 * PermissionGuard — Renders children only if the user has the required permission.
 * Otherwise renders the UnauthorizedPage component.
 *
 * Usage:
 *   <PermissionGuard permission="CREATE_USER">
 *     <AddUser />
 *   </PermissionGuard>
 */
const PermissionGuard = ({ permission, children }) => {
    const { hasPermission } = usePermissions();

    if (!hasPermission(permission)) {
        return <UnauthorizedPage />;
    }

    return <>{children}</>;
};

export default PermissionGuard;
