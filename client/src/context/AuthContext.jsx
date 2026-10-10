import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useLocation } from "./LocationContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("asali_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // 🌍 Location hook
  const { autoDetectLocation, location } = useLocation();

  useEffect(() => {
    if (user) {
      localStorage.setItem("asali_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("asali_user");
    }
  }, [user]);

  // 🌍 Helper — auto-detect location (agar pehle se nahi hai)
  const tryAutoDetectLocation = async () => {
    // Agar location already saved hai — skip
    if (location || localStorage.getItem("asali_location")) {
      return;
    }

    try {
      await autoDetectLocation();
      console.log("✅ Location auto-detected");
    } catch (err) {
      console.log("⚠️ Location auto-detect skipped:", err);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", data);
      localStorage.setItem("asali_token", res.data.token);
      setUser(res.data.user);

      // 🌍 Auto-detect location after signup
      await tryAutoDetectLocation();

      return { success: true, user: res.data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("asali_token", res.data.token);
      setUser(res.data.user);

      // 🌍 Auto-detect location after login
      await tryAutoDetectLocation();

      return { success: true, user: res.data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("asali_token");
    localStorage.removeItem("asali_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);