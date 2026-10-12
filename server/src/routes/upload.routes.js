import express from "express";
import multer from "multer";
import {
  uploadImage,
  uploadMultipleImages,
} from "../controllers/upload.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Multer — memory storage (Cloudinary me directly upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"), false);
    }
  },
});

// Single image upload
router.post("/", protect, upload.single("image"), uploadImage);

// Multiple images upload (max 5)
router.post(
  "/multiple",
  protect,
  upload.array("images", 5),
  uploadMultipleImages
);

export default router;