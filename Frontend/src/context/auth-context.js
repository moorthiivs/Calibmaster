import { createContext } from "react";

export const AuthContext = createContext({
  isLoggedIn: false,
  token: null,
  userId: null,
  name: null,
  department: null,
  email: null,
  labId: null,
  roleId: null,
  logo: null,
  permissions: [],
  backEndVersion: null,
  login: () => {},
  logout: () => {},
  switchLab: () => {},
  setLogo: () => {},
  updatePermissions: () => {},
});
