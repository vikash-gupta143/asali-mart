import express from "express";
import {
  registerDeliveryPartner,
  getMyApplication,
  getAllApplications,
  verifyApplication,
  updateLocation,
  toggleAvailability,
  getNearbyPartners,
} from "../controllers/deliveryPartner.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// All routes protected
router.use(protect);

// ============================================
// 📝 Registration (with file upload)
// ============================================
router.post(
  "/register",
  upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
    { name: "rcDocument", maxCount: 1 },
  ]),
  registerDeliveryPartner
);

// ============================================
// 📋 My application
// ============================================
router.get("/me", getMyApplication);

// ============================================
// 📍 Location & Availability (delivery partner)
// ============================================
router.put(
  "/location",
  authorize("DELIVERY_PARTNER", "ADMIN"),
  updateLocation
);

router.put(
  "/availability",
  authorize("DELIVERY_PARTNER", "ADMIN"),
  toggleAvailability
);

// ============================================
// 🌍 Nearby partners (seller, admin)
// ============================================
router.get(
  "/nearby",
  authorize("SELLER", "ADMIN"),
  getNearbyPartners
);

// ============================================
// 🛡️ Admin
// ============================================
router.get("/", authorize("ADMIN"), getAllApplications);
router.put("/:id/verify", authorize("ADMIN"), verifyApplication);

export default router;