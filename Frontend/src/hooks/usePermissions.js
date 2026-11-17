import { useContext } from "react";
import { AuthContext } from "../context/auth-context";

const ROOT_ONLY_PERMISSIONS = [
  "ACCESS_USER_TRACK",
  "MANAGE_LABS",
  "SYNC_DATA",
];

export const usePermissions = () => {
  const auth = useContext(AuthContext);

  const hasPermission = (permission) => {
    if (!auth || !auth.isLoggedIn) return false;
    
    // Root has full access to everything
    if (auth.department === "root") return true;

    // Admin no longer has hardcoded full access; it now respects the assigned permissions.
    // Only 'root' retains a full bypass.
    
    const userPermissions = auth.permissions || [];
    return userPermissions.includes(permission);
  };

  /**
   * Returns true if the user has at least one of the given permissions.
   * FIX: Added explicit admin bypass (was previously relying on hasPermission 
   * being called indirectly — now correctly mirrors hasPermission's admin logic).
   */
  const hasAnyPermission = (permissions) => {
    if (!auth || !auth.isLoggedIn) return false;
    if (auth.department === "root") return true;

    // Admin no longer has hardcoded full access; it now respects the assigned permissions.
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    if (!auth || !auth.isLoggedIn) return false;
    if (auth.department === "root") return true;
    
    return permissions.every(permission => hasPermission(permission));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};

export default usePermissions;
