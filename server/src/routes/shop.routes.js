import express from "express";
import {
  getNearbyShops,
  getAllShops,
  getShopById,
  createShop,
  updateShop,
  getMyShop,
  getNearbyProducts,
  adminGetAllShops,
  verifyShop,
   checkPincode,
} from "../controllers/shop.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { uploadShopDocs } from "../middlewares/upload.middleware.js";

const router = express.Router();

// ============ ADMIN ROUTES (top pe) ============
router.get("/admin/all", protect, authorize("ADMIN"), adminGetAllShops);
router.put("/:id/verify", protect, authorize("ADMIN"), verifyShop);

// ============ PUBLIC ROUTES ============
router.get("/", getAllShops);
router.get("/nearby", getNearbyShops);
router.get("/nearby-products", getNearbyProducts);

// ============ SELLER ROUTES ============
router.get("/my/shop", protect, authorize("SELLER", "ADMIN"), getMyShop);
router.post("/check-pincode", checkPincode);

// Create shop with document upload
router.post(
  "/",
  protect,
  authorize("SELLER", "ADMIN"),
  uploadShopDocs.fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
    { name: "shopLicense", maxCount: 1 },
    { name: "shopFrontPhoto", maxCount: 1 },
    { name: "insideShopPhoto", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "bankCheque", maxCount: 1 },
  ]),
  createShop
);

router.put(
  "/:id",
  protect,
  authorize("SELLER", "ADMIN"),
  uploadShopDocs.fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
    { name: "shopLicense", maxCount: 1 },
    { name: "shopFrontPhoto", maxCount: 1 },
    { name: "insideShopPhoto", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "bankCheque", maxCount: 1 },
  ]),
  updateShop
);

// ⚠️ LAST — dynamic route
router.get("/:id", protect, getShopById);

export default router;