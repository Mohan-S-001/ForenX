import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5001/api" });

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("forenx_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("forenx_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      API.get("/auth/me")
        .then((r) => setUser(r.data.user))
        .catch(() => { localStorage.removeItem("forenx_token"); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem("forenx_token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("forenx_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, API }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { API };
