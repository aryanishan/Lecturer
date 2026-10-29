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
  const [user, setUser] = useState(() => {
    const saved = typeof window !== "undefined" && window.localStorage.getItem("studyshelf-user");
    return saved ? JSON.parse(saved) : { email: "myteam034221@gmail.com" };
  });
  const [isRestoring, setIsRestoring] = useState(false);
  useEffect(() => {
    if (!getAuthToken()) return;
    setIsRestoring(true);
    getAccountData()
      .then((data) => {
        hydrateLocalData(data);
        setUser((prev) => prev || { email: "myteam034221@gmail.com" });
      })
      .catch(() => clearAuthToken())
      .finally(() => setIsRestoring(false));
  }, []);
  const value = {
    user,
    isRestoring,
    login: async (credentials) => {
      const u = await authenticate(loginAccount, credentials);
      setUser(u);
      window.localStorage.setItem("studyshelf-user", JSON.stringify(u));
    },
    register: async (credentials) => {
      const u = await authenticate(registerAccount, credentials);
      setUser(u);
      window.localStorage.setItem("studyshelf-user", JSON.stringify(u));
    },
    logout: () => {
      clearAuthToken();
      window.localStorage.removeItem("studyshelf-user");
      setUser(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider."); return context; }
