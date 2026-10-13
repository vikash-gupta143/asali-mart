import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  saveFcmToken,
  forgotPassword,   // 🆕
  resetPassword,    // 🆕
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================
// ✅ PUBLIC ROUTES
// ============================================
router.post("/register", register);
router.post("/login", login);

// ============================================
// 🔐 PASSWORD RESET ROUTES (Public — no auth)
// ============================================
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// ============================================
// 🔒 PROTECTED ROUTES
// ============================================
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/save-fcm-token", protect, saveFcmToken);

export default router;