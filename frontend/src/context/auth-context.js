import { createContext } from "react";

export const AuthContext = createContext({
  isLoggedIn: false,
  token: null,
  userId: null,
  name: null,
  department: null,
  email: null,
  labId: null,
  backEndVersion: null,
  login: () => {},
  logout: () => {},
});
