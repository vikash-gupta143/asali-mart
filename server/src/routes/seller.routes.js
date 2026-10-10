import express from "express";
import { getSellerEarnings } from "../controllers/seller.controller.js";
import {
  getSellerWallet,
  updateBankDetails,
  requestWithdraw,
  getMyPayouts,
} from "../controllers/sellerWallet.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("SELLER", "ADMIN"));

// Earnings
router.get("/earnings", getSellerEarnings);

// Wallet
router.get("/wallet", getSellerWallet);
router.put("/bank", updateBankDetails);
router.post("/withdraw", requestWithdraw);
router.get("/payouts", getMyPayouts);

export default router;