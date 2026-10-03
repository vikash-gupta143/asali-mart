import express from "express";
import {
  getAvailableOrders,
  acceptDelivery,
  markPickedUp,
  verifyOTPAndDeliver,
  getMyDeliveries,
  getEarnings,
  registerAsDeliveryPartner,
} from "../controllers/delivery.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Register as delivery partner (any logged-in user)
router.post("/register", registerAsDeliveryPartner);

// Delivery partner only
router.get(
  "/available",
  authorize("DELIVERY_PARTNER", "ADMIN"),
  getAvailableOrders
);
router.put(
  "/:id/accept",
  authorize("DELIVERY_PARTNER", "ADMIN"),
  acceptDelivery
);
router.put(
  "/:id/pickup",
  authorize("DELIVERY_PARTNER", "ADMIN"),
  markPickedUp
);
router.put(
  "/:id/deliver",
  authorize("DELIVERY_PARTNER", "ADMIN"),
  verifyOTPAndDeliver
);
router.get(
  "/my-deliveries",
  authorize("DELIVERY_PARTNER", "ADMIN"),
  getMyDeliveries
);
router.get(
  "/earnings",
  authorize("DELIVERY_PARTNER", "ADMIN"),
  getEarnings
);

export default router;