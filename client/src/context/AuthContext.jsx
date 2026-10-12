import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useLocation } from "./LocationContext";
// 🔔 Firebase Imports
import { getMessaging, getToken } from "firebase/messaging";

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

  // 🔔 FCM Token Request & Save to Server
  const requestNotificationPermission = async () => {
    try {
      if (!("Notification" in window)) {
        console.log("⚠️ This browser does not support notifications");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("⚠️ Notification permission denied");
        return;
      }

      // Note: 'messaging' variable global nahi hai, isliye yahan getMessaging call karenge.
      // Lekin behtar hai ki aap ise kisi central firebase.js file se import karein.
      // Abhi ke liye hum assume kar rahe hain ki firebase already initialized hai (main.jsx me).
      const { getApp } = await import("firebase/app");
      const messaging = getMessaging(getApp());

      const token = await getToken(messaging, {
        vapidKey: "BKKADvv_vkv0b0tteqwvq0jFTQ0eZlhN2JZl4SSgkXUeYw28u2HU1dc_6F-JARkYQiedOSJ_0tQ3ccarxMgMCCA", // 🔴 Ye key Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates se lena
      });

      if (token) {
        console.log("✅ FCM Token:", token);
        // Server pe token bhejein
        await api.post("/auth/save-fcm-token", { fcmToken: token });
      } else {
        console.log("⚠️ No registration token available.");
      }
    } catch (error) {
      console.error("❌ Error getting FCM token:", error);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", data);
      localStorage.setItem("asali_token", res.data.token);
      setUser(res.data.user);

      // 🔔 Request Notification Permission after signup
      await requestNotificationPermission();

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

      // 🔔 Request Notification Permission after login
      await requestNotificationPermission();

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

export const useAuth = ( ) => useContext(AuthContext);