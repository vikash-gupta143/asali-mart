import express from "express";
import {
  createReturnRequest,
  getMyReturns,
  getReturnById,
  getSellerReturns,
  approveReturn,
  rejectReturn,
  schedulePickup,
  autoAssignPickup,   // 🆕 YEH ADD
  verifyPickupOTP,
  markReturnReceived,
  processRefund,
  getAllReturns,
  getReturnReasons,
} from "../controllers/return.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================================
// 👤 CUSTOMER ROUTES
// ============================================================
router.post("/", protect, createReturnRequest);
router.get("/my-returns", protect, getMyReturns);

// ============================================================
// 📋 GET RETURN REASONS (Category-based) — Customer
// ============================================================
router.get("/reasons/:orderId", protect, getReturnReasons);

// ============================================================
// 🏪 SELLER ROUTES
// ============================================================
router.get(
  "/seller/returns",
  protect,
  authorize("SELLER", "ADMIN"),
  getSellerReturns
);

// ============================================================
// 👑 ADMIN ROUTES
// ============================================================
router.get(
  "/admin/all",
  protect,
  authorize("ADMIN"),
  getAllReturns
);

// ============================================================
// 🚚 PICKUP PARTNER ROUTES
// ============================================================
router.put(
  "/:id/verify-pickup-otp",
  protect,
  authorize("DELIVERY_PARTNER", "ADMIN"),
  verifyPickupOTP
);

// ============================================================
// ✅ APPROVE / REJECT (Seller + Admin)
// ============================================================
router.put(
  "/:id/approve",
  protect,
  authorize("SELLER", "ADMIN"),
  approveReturn
);

router.put(
  "/:id/reject",
  protect,
  authorize("SELLER", "ADMIN"),
  rejectReturn
);

// ============================================================
// 🚚 SCHEDULE PICKUP (Admin)
// ============================================================
router.put(
  "/:id/schedule-pickup",
  protect,
  authorize("ADMIN"),
  schedulePickup
);


// ============================================================
// 🚚 AUTO-ASSIGN PICKUP (Admin) — Nearest Partner
// ============================================================
router.put(
  "/:id/auto-assign",
  protect,
  authorize("ADMIN"),
  autoAssignPickup
);

// ============================================================
// 📥 MARK RECEIVED (Seller + Admin)
// ============================================================
router.put(
  "/:id/received",
  protect,
  authorize("SELLER", "ADMIN"),
  markReturnReceived
);

// ============================================================
// 💸 PROCESS REFUND (Seller + Admin)
// ============================================================
router.put(
  "/:id/refund",
  protect,
  authorize("SELLER", "ADMIN"),
  processRefund
);

// ============================================================
// 📦 GET SINGLE RETURN (Last — dynamic :id)
// ============================================================
router.get("/:id", protect, getReturnById);
router.get("/reasons/:orderId", protect, getReturnReasons);

export default router;