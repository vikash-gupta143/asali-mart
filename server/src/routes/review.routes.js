import express from "express";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
  sellerRespond,
  getMyReviews,
} from "../controllers/review.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public
router.get("/product/:productId", getProductReviews);

// Private
router.post("/", protect, createReview);
router.get("/my-reviews", protect, getMyReviews);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);
router.put("/:id/helpful", protect, markHelpful);
router.put("/:id/respond", protect, authorize("SELLER", "ADMIN"), sellerRespond);

export default router;