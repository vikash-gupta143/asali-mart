import Coupon from "../models/Coupon.js";

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Private
export const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderValue } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Code required" });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon" });
    }

    // Date validity
    const now = new Date();
    if (now < coupon.validFrom) {
      return res.status(400).json({ success: false, message: "Coupon not started" });
    }
    if (now > coupon.validUntil) {
      return res.status(400).json({ success: false, message: "Coupon expired" });
    }

    // Usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon limit reached" });
    }

    // Min order value
    if (orderValue < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order ₹${coupon.minOrderValue} required`,
      });
    }

    // Per user limit
    const userUsage = coupon.usedBy.filter(
      (u) => u.user.toString() === req.user._id.toString()
    );
    if (userUsage.length >= coupon.perUserLimit) {
      return res.status(400).json({ success: false, message: "Already used" });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = Math.round((orderValue * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount,
        description: coupon.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active coupons (public)
// @route   GET /api/coupons
// @access  Public
export const getActiveCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      validUntil: { $gte: new Date() },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
    }).select("-usedBy");

    res.json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin — create coupon
// @route   POST /api/coupons
// @access  Private (ADMIN)
export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin — get all coupons
// @route   GET /api/coupons/admin
// @access  Private (ADMIN)
export const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin — delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private (ADMIN)
export const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    next(error);
  }
};