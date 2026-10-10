import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getAllProducts,
  toggleProductStatus,
  deleteProductAdmin,
  getAllOrders,
  deleteOrderAdmin,
  getRevenueAnalytics,
  getPendingPayments,
  verifyPayment,
} from "../controllers/admin.controller.js";

import {
  getAllPayouts,
  approvePayout,
  rejectPayout,
  markPayoutPaid,
  verifySellerBank,
  getBankVerifications,
  verifySellerBankDetails,
  rejectSellerBankDetails,
} from "../controllers/adminPayout.controller.js";

// 🆕 Delivery Partner Bank Verification
import {
  getDeliveryBankVerifications,
  verifyDeliveryBank,
  rejectDeliveryBank,
} from "../controllers/deliveryPartner.controller.js";

import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("ADMIN"));

// ——— Dashboard ———
router.get("/stats", getDashboardStats);
router.get("/revenue", getRevenueAnalytics);

// ——— Users ———
router.get("/users", getAllUsers);
router.put("/users/:id/toggle", toggleUserStatus);
router.delete("/users/:id", deleteUser);

// ——— Products ———
router.get("/products", getAllProducts);
router.put("/products/:id/toggle", toggleProductStatus);
router.delete("/products/:id", deleteProductAdmin);

// ——— Orders ———
router.get("/orders", getAllOrders);
router.delete("/orders/:id", deleteOrderAdmin);

// ——— Payouts ———
router.get("/payouts", getAllPayouts);
router.put("/payouts/:id/approve", approvePayout);
router.put("/payouts/:id/reject", rejectPayout);
router.put("/payouts/:id/paid", markPayoutPaid);
router.put("/sellers/:sellerId/verify-bank", verifySellerBank);

// ——— Seller Bank Verification ———
router.get("/bank-verifications", getBankVerifications);
router.put("/bank-verifications/:sellerId/verify", verifySellerBankDetails);
router.put("/bank-verifications/:sellerId/reject", rejectSellerBankDetails);

// 🆕 ——— Delivery Partner Bank & UPI Verification ———
router.get("/delivery-bank-verifications", getDeliveryBankVerifications);
router.put(
  "/delivery-bank-verifications/:partnerId/verify",
  verifyDeliveryBank
);
router.put(
  "/delivery-bank-verifications/:partnerId/reject",
  rejectDeliveryBank
);

//admin
router.get("/orders/pending-payments", getPendingPayments);
router.put("/orders/:id/verify-payment", verifyPayment);

export default router;