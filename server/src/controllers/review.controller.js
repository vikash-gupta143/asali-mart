import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// 🧮 Helper — product ka rating update karo
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId, isActive: true });

  const numReviews = reviews.length;
  const avgRating =
    numReviews === 0
      ? 0
      : Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews) * 10
        ) / 10;

  await Product.findByIdAndUpdate(productId, {
    rating: avgRating,
    numReviews,
  });

  return { avgRating, numReviews };
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      isActive: true,
    })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    // Rating breakdown (5★, 4★, 3★, 2★, 1★)
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    });

    const avgRating =
      reviews.length === 0
        ? 0
        : Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
          ) / 10;

    res.json({
      success: true,
      count: reviews.length,
      avgRating,
      breakdown,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment, images } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Product, rating, and comment required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if user already reviewed
    const existing = await Review.findOne({
      product: productId,
      user: req.user._id,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product",
      });
    }

    // Check verified purchase — did user order this product & got delivered?
    const order = await Order.findOne({
      user: req.user._id,
      "items.product": productId,
      orderStatus: "DELIVERED",
    });

    const isVerifiedPurchase = !!order;

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      order: order?._id || null,
      rating,
      title,
      comment,
      images: images || [],
      isVerifiedPurchase,
    });

    // Update product rating
    const { avgRating, numReviews } = await updateProductRating(productId);

    const populated = await Review.findById(review._id).populate(
      "user",
      "name avatar"
    );

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: populated,
      productRating: avgRating,
      totalReviews: numReviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (owner)
export const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (req.body.rating) review.rating = req.body.rating;
    if (req.body.title !== undefined) review.title = req.body.title;
    if (req.body.comment) review.comment = req.body.comment;
    if (req.body.images) review.images = req.body.images;

    await review.save();
    await updateProductRating(review.product);

    res.json({ success: true, message: "Review updated", review });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (owner or ADMIN)
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);
    await updateProductRating(productId);

    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
export const markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    const userId = req.user._id.toString();
    const already = review.helpfulBy.some((id) => id.toString() === userId);

    if (already) {
      review.helpfulBy = review.helpfulBy.filter((id) => id.toString() !== userId);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      review.helpfulBy.push(req.user._id);
      review.helpfulCount += 1;
    }

    await review.save();

    res.json({
      success: true,
      helpfulCount: review.helpfulCount,
      isHelpful: !already,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seller respond to review
// @route   PUT /api/reviews/:id/respond
// @access  Private (SELLER)
export const sellerRespond = async (req, res, next) => {
  try {
    const { text } = req.body;
    const review = await Review.findById(req.params.id).populate("product");

    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    if (review.product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your product" });
    }

    review.sellerResponse = { text, at: new Date() };
    await review.save();

    res.json({ success: true, message: "Response added", review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my reviews (as customer)
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("product", "name images")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};