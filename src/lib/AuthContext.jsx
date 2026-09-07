import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me()
      .then((res) => setUser(res.data.authenticated ? res.data.user : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    if (res.data.token) localStorage.setItem('auth_token', res.data.token);
    const meRes = await authApi.me();
    setUser(meRes.data.authenticated ? meRes.data.user : null);
    return res.data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
