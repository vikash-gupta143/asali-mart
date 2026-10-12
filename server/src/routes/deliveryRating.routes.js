import express from "express";
import {
  createDeliveryRating,
  getMyRating,
  getMyRatings,
  getPartnerRatings,
  getAllPartnerRatings,
  getMyRatingStats,
} from "../controllers/deliveryRating.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================================
// 👤 CUSTOMER ROUTES
// ============================================================
// Customer rating submit kare
router.post("/", protect, createDeliveryRating);

// Customer apni rating dekhe (specific order ke liye)
router.get("/order/:orderId", protect, getMyRating);

// ============================================================
// 🚚 DELIVERY PARTNER ROUTES
// ============================================================
// Delivery partner apni saari ratings dekhe
router.get(
  "/my-ratings",
  protect,
  authorize("DELIVERY_PARTNER"),
  getMyRatings
);

// Delivery partner apna stats dekhe
router.get(
  "/my-stats",
  protect,
  authorize("DELIVERY_PARTNER"),
  getMyRatingStats
);

// ============================================================
// 👑 ADMIN ROUTES
// ============================================================
// Admin saare partners ki ratings dekhe
router.get(
  "/admin/all-partners",
  protect,
  authorize("ADMIN"),
  getAllPartnerRatings
);

// Admin specific partner ki ratings dekhe
router.get(
  "/admin/partner/:partnerId",
  protect,
  authorize("ADMIN"),
  getPartnerRatings
);

export default router;