import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} from "../controllers/product.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/seller/my-products", protect, authorize("SELLER", "ADMIN"), getMyProducts);
router.get("/:id", getProductById);

// Protected routes
router.post("/", protect, authorize("SELLER", "ADMIN"), createProduct);
router.put("/:id", protect, authorize("SELLER", "ADMIN"), updateProduct);
router.delete("/:id", protect, authorize("SELLER", "ADMIN"), deleteProduct);

export default router;