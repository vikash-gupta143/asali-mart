import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateOrderStatus,
  sellerVerifyOTPAndDeliver,
  getOrderTracking,
} from "../controllers/order.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get(
  "/seller/orders",
  protect,
  authorize("SELLER", "ADMIN"),
  getSellerOrders
);
router.get("/:id/tracking", protect, getOrderTracking);
router.get("/:id", protect, getOrderById);
router.put("/:id/cancel", protect, cancelOrder);
router.put(
  "/:id/status",
  protect,
  authorize("SELLER", "ADMIN"),
  updateOrderStatus
);

// 🆕 Seller — verify OTP and mark delivered
router.put(
  "/:id/seller-deliver",
  protect,
  authorize("SELLER", "ADMIN"),
  sellerVerifyOTPAndDeliver
);

export default router;