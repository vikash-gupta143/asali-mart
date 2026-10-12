import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import morgan from "morgan";

// 🔔 Firebase Admin SDK Imports
import admin from "firebase-admin";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { config } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import deliveryPartnerRoutes from "./routes/deliveryPartner.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import returnRoutes from "./routes/return.routes.js";
import deliveryRatingRoutes from "./routes/deliveryRating.routes.js";
import sellerAnalyticsRoutes from "./routes/sellerAnalytics.routes.js";

import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import {
  helmetMiddleware,
  generalLimiter,
  authLimiter,
  sanitizeData,
  preventParamPollution,
} from "./middlewares/security.middleware.js";

// 🔔 Initialize Firebase Admin
try {
  if (getApps().length === 0) {
    if (
      !config.firebase.projectId ||
      !config.firebase.privateKey ||
      !config.firebase.clientEmail
    ) {
      console.warn("⚠️ Firebase Admin skipped: Missing credentials in .env");
    } else {
      initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          privateKeyId: config.firebase.privateKeyId,
          privateKey: config.firebase.privateKey,
          clientEmail: config.firebase.clientEmail,
          clientId: config.firebase.clientId,
          clientCertUrl: config.firebase.clientCertUrl,
        }),
      });
      console.log("✅ Firebase Admin initialized successfully");
    }
  } else {
    console.log("✅ Firebase Admin already initialized");
  }
} catch (error) {
  console.error("❌ Firebase Admin initialization failed:", error.message);
}

const app = express();

// 🔔 Trust proxy (Ngrok/Production ke liye zaroori)
app.set("trust proxy", 1);

// ——— Security ———
app.use(helmetMiddleware);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(generalLimiter);

// 🔔🔔🔔 WEBHOOK MUST BE BEFORE express.json() 🔔🔔🔔
app.use("/api/webhooks", webhookRoutes);
app.use("/api/upload", uploadRoutes);

// ——— Body Parsing (ab webhook ke baad) ———
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(sanitizeData);
app.use(preventParamPollution);
app.use(compression());

// ——— Logging ———
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ——— Health Check ———
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🛒 AsaliMart API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ——— Other Routes ———
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/delivery-partners", deliveryPartnerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/delivery-ratings", deliveryRatingRoutes);
app.use("/api/seller/analytics", sellerAnalyticsRoutes);

// ——— Debug ———
console.log("🔍 Routes registered:");
console.log("   /api/webhooks/*  🔔 (raw body)");
console.log("   /api/auth/*");
console.log("   /api/products/*");
console.log("   /api/orders/*");
console.log("   /api/admin/*");
console.log("   /api/shops/*");
console.log("   /api/chats/*");
console.log("   /api/reviews/*");
console.log("   /api/delivery/*");
console.log("   /api/delivery-partners/*");
console.log("   /api/coupons/*");
console.log("   /api/seller/*");
console.log("   /api/settings/*");
console.log("   /api/returns/*  🔄 NEW");
console.log("   /api/delivery-ratings/*  ⭐ NEW");
console.log("   /api/seller/analytics/*  📊 NEW");
console.log("   /api/upload/*  📤 NEW");

// ——— Error Handling ———
app.use(notFound);
app.use(errorHandler);

export default app;