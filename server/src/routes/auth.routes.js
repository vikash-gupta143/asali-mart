// import express from "express";
// import {
//   register,
//   login,
//   getMe,
//   logout,
// } from "../controllers/auth.controller.js";
// import { protect } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// router.post("/register", register);
// router.post("/login", login);
// router.get("/me", protect, getMe);
// router.post("/logout", protect, logout);

// export default router;

import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  saveFcmToken, // 🔔 Naya import
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ✅ YE 4 ROUTES ZAROORI HAIN
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

// 🔔 FCM Token Save Route
router.post("/save-fcm-token", protect, saveFcmToken);

export default router;