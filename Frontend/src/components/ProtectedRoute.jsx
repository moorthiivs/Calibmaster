import React from "react";
import UnauthorizedPage from "./BodyContent/UnauthorizedPage";
import { usePermissions } from "../hooks/usePermissions";

const ProtectedRoute = ({ element, requiredPermission, requiredAnyPermission, requiredAllPermissions }) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = true;

  if (requiredPermission && !hasPermission(requiredPermission)) {
    hasAccess = false;
  }
  if (requiredAnyPermission && !hasAnyPermission(requiredAnyPermission)) {
    hasAccess = false;
  }
  if (requiredAllPermissions && !hasAllPermissions(requiredAllPermissions)) {
    hasAccess = false;
  }

  if (!hasAccess) {
    return <UnauthorizedPage />;
  }

  return element;
};

export default ProtectedRoute;
