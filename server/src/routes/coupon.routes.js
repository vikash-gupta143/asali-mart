import express from "express";
import {
  validateCoupon,
  getActiveCoupons,
  createCoupon,
  getAllCoupons,
  deleteCoupon,
} from "../controllers/coupon.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getActiveCoupons);
router.post("/validate", protect, validateCoupon);

// Admin
router.post("/", protect, authorize("ADMIN"), createCoupon);
router.get("/admin", protect, authorize("ADMIN"), getAllCoupons);
router.delete("/:id", protect, authorize("ADMIN"), deleteCoupon);

export default router;