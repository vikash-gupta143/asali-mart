import express from "express";
import {
  getSellerAnalytics,
  getMonthlyRevenue,
} from "../controllers/sellerAnalytics.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================================
// 📊 SELLER ANALYTICS ROUTES
// ============================================================

// Complete analytics dashboard
router.get(
  "/",
  protect,
  authorize("SELLER", "ADMIN"),
  getSellerAnalytics
);

// Monthly revenue (last 12 months)
router.get(
  "/monthly-revenue",
  protect,
  authorize("SELLER", "ADMIN"),
  getMonthlyRevenue
);

export default router;