import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// 📁 Shop documents storage
const shopStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "asalimart/shops",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
    public_id: `${Date.now()}-${file.fieldname}-${file.originalname.split(".")[0]}`,
    transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
  }),
});

export const uploadShopDocs = multer({
  storage: shopStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// 📁 Delivery partner documents
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "asalimart/delivery-partners",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
    transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 📁 Product images
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "asalimart/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit", quality: "auto" }],
  },
});

export const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});