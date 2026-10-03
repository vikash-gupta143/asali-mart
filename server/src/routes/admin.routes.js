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
} from "../controllers/admin.controller.js";
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

export default router;