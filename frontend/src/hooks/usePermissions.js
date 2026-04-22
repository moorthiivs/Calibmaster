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
    if (auth.department && auth.department.toLowerCase() === "root") return true;

    // Admin has full access to everything EXCEPT root-only features
    if (auth.department && auth.department.toLowerCase() === "admin") {
      if (ROOT_ONLY_PERMISSIONS.includes(permission)) return false;
      return true;
    }

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
    if (auth.department && auth.department.toLowerCase() === "root") return true;

    // Admin gets all non-ROOT_ONLY permissions
    if (auth.department && auth.department.toLowerCase() === "admin") {
      return permissions.some(p => !ROOT_ONLY_PERMISSIONS.includes(p));
    }

    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    if (!auth || !auth.isLoggedIn) return false;
    if (auth.department && auth.department.toLowerCase() === "root") return true;
    
    return permissions.every(permission => hasPermission(permission));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};

export default usePermissions;
