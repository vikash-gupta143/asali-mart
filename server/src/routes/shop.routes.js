import express from "express";
import {
  getNearbyShops,
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  getMyShop,
  getNearbyProducts,
} from "../controllers/shop.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public
router.get("/", getAllShops);
router.get("/nearby", getNearbyShops);
router.get("/nearby-products", getNearbyProducts);

// Seller protected
router.get("/my/shop", protect, authorize("SELLER", "ADMIN"), getMyShop);
router.post("/", protect, authorize("SELLER", "ADMIN"), createShop);
router.put("/:id", protect, authorize("SELLER", "ADMIN"), updateShop);

// Public (must be last — because it has :id)
router.get("/:id", getShopById);

export default router;