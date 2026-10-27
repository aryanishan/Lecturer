import { createContext, useContext, useEffect, useState } from "react";
import { clearAuthToken, getAccountData, getAuthToken, loginAccount, registerAccount, saveAccountData, setAuthToken } from "./services/api";
import { getLocalData, hasLocalData, hydrateLocalData } from "./utils/storage";
const AuthContext = createContext(null);
async function authenticate(action, credentials) {
  const localData = getLocalData(); const result = await action(credentials); setAuthToken(result.token);
  const accountData = await getAccountData(); const data = hasLocalData(accountData) || !hasLocalData(localData) ? accountData : await saveAccountData(localData);
  hydrateLocalData(data); return result.user;
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [isRestoring, setIsRestoring] = useState(Boolean(getAuthToken()));
  useEffect(() => { if (!getAuthToken()) return; getAccountData().then((data) => { hydrateLocalData(data); setUser({ email: "Signed in" }); }).catch(() => clearAuthToken()).finally(() => setIsRestoring(false)); }, []);
  const value = { user, isRestoring, login: async (credentials) => { setUser(await authenticate(loginAccount, credentials)); }, register: async (credentials) => { setUser(await authenticate(registerAccount, credentials)); }, logout: () => { clearAuthToken(); setUser(null); } };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider."); return context; }
