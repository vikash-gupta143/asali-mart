import DeliveryRating from "../models/DeliveryRating.js";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendNotificationToUser } from "../utils/sendNotification.js";
import { emitToUser } from "../config/socket.js";

// ============================================================
// ⭐ CUSTOMER — Create Delivery Rating
// ============================================================
export const createDeliveryRating = async (req, res, next) => {
  try {
    const { orderId, rating, feedback, tags, isAnonymous } = req.body;

    // Validation
    if (!orderId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Order ID aur rating zaroori hai",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating 1 se 5 ke beech honi chahiye",
      });
    }

    // Order dhundo
    const order = await Order.findById(orderId).populate(
      "deliveryPartner",
      "name phone"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ki yeh order isi customer ka hai
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Yeh aapka order nahi hai",
      });
    }

    // Order delivered hona chahiye
    if (order.orderStatus !== "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Sirf delivered orders ko rate kar sakte hain",
      });
    }

    // Delivery partner assign hona chahiye
    if (!order.deliveryPartner) {
      return res.status(400).json({
        success: false,
        message: "Is order me koi delivery partner nahi tha",
      });
    }

    // Check karo ki already rating di hai?
    const existingRating = await DeliveryRating.findOne({
      order: orderId,
      customer: req.user._id,
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: "Aap is order ko already rate kar chuke hain",
      });
    }

    // Rating create karo
    const newRating = await DeliveryRating.create({
      order: orderId,
      deliveryPartner: order.deliveryPartner._id,
      customer: req.user._id,
      rating,
      feedback: feedback || "",
      tags: tags || [],
      isAnonymous: isAnonymous || false,
      deliveryType: "ORDER_DELIVERY",
    });

    console.log(`⭐ New rating: ${rating} stars for ${order.deliveryPartner.name}`);

    // Delivery partner ki average rating update karo
    await updateDeliveryPartnerRating(order.deliveryPartner._id);

    // 🔔 Delivery partner ko notification
    try {
      await sendNotificationToUser(
        order.deliveryPartner._id.toString(),
        `⭐ New Rating: ${rating} Stars`,
        `Aapko ${rating} star mila hai ${rating >= 4 ? "🎉" : ""}`,
        {
          orderId: order._id.toString(),
          type: "NEW_RATING",
          link: `/delivery/dashboard`,
        }
      );

      emitToUser(order.deliveryPartner._id.toString(), "rating:new", {
        orderId: order._id,
        rating,
        message: `⭐ ${rating} star mila!`,
      });
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Rating successfully submit ho gayi",
      rating: newRating,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 🚀 HELPER — Update Delivery Partner Average Rating
// ============================================================
const updateDeliveryPartnerRating = async (partnerUserId) => {
  try {
    // Saari ratings nikalo
    const ratings = await DeliveryRating.find({
      deliveryPartner: partnerUserId,
    });

    if (ratings.length === 0) {
      return;
    }

    // Average calculate karo
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;

    // Breakdown calculate karo
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    });

    // Delivery partner update karo
    await DeliveryPartner.findOneAndUpdate(
      { user: partnerUserId },
      {
        rating: Math.round(averageRating * 10) / 10, // 1 decimal place
        totalRatings: ratings.length,
        ratingBreakdown: breakdown,
      }
    );

    console.log(
      `📊 Rating updated: ${averageRating.toFixed(1)} (${ratings.length} reviews)`
    );
  } catch (error) {
    console.error("❌ Rating update error:", error.message);
  }
};

// ============================================================
// 📦 CUSTOMER — Get My Rating for Order
// ============================================================
export const getMyRating = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const rating = await DeliveryRating.findOne({
      order: orderId,
      customer: req.user._id,
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: "No rating found",
      });
    }

    res.status(200).json({
      success: true,
      rating,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ⭐ DELIVERY PARTNER — Get My Ratings
// ============================================================
export const getMyRatings = async (req, res, next) => {
  try {
    const ratings = await DeliveryRating.find({
      deliveryPartner: req.user._id,
    })
      .populate("order", "orderNumber")
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    // Partner profile bhi laao
    const partner = await DeliveryPartner.findOne({ user: req.user._id });

    // Ratings ko anonymously dikhao agar chahe
    const formattedRatings = ratings.map((r) => ({
      _id: r._id,
      rating: r.rating,
      feedback: r.feedback,
      tags: r.tags,
      createdAt: r.createdAt,
      orderNumber: r.order?.orderNumber || "N/A",
      customerName: r.isAnonymous ? "Anonymous" : r.customer?.name || "Customer",
    }));

    res.status(200).json({
      success: true,
      count: ratings.length,
      ratings: formattedRatings,
      stats: {
        averageRating: partner?.rating || 0,
        totalRatings: partner?.totalRatings || 0,
        breakdown: partner?.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 👑 ADMIN — Get Delivery Partner Rating Analytics
// ============================================================
export const getPartnerRatings = async (req, res, next) => {
  try {
    const { partnerId } = req.params;

    const ratings = await DeliveryRating.find({
      deliveryPartner: partnerId,
    })
      .populate("order", "orderNumber")
      .populate("customer", "name email")
      .sort({ createdAt: -1 });

    const partner = await DeliveryPartner.findOne({ user: partnerId }).populate(
      "user",
      "name email phone"
    );

    res.status(200).json({
      success: true,
      partner: {
        name: partner?.fullName || partner?.user?.name,
        email: partner?.user?.email,
        phone: partner?.phone || partner?.user?.phone,
        rating: partner?.rating || 0,
        totalRatings: partner?.totalRatings || 0,
        breakdown: partner?.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        totalDeliveries: partner?.totalDeliveries || 0,
        totalReturns: partner?.totalReturns || 0,
      },
      ratings,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 👑 ADMIN — Get All Delivery Partners with Ratings
// ============================================================
export const getAllPartnerRatings = async (req, res, next) => {
  try {
    const partners = await DeliveryPartner.find({
      status: "APPROVED",
    })
      .populate("user", "name email phone")
      .sort({ rating: -1 });

    const formatted = partners.map((p) => ({
      _id: p._id,
      userId: p.user?._id,
      name: p.fullName || p.user?.name,
      email: p.user?.email,
      phone: p.phone || p.user?.phone,
      rating: p.rating || 0,
      totalRatings: p.totalRatings || 0,
      breakdown: p.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      totalDeliveries: p.totalDeliveries || 0,
      totalReturns: p.totalReturns || 0,
      isAvailable: p.isAvailable,
      vehicle: p.vehicle,
    }));

    // Stats
    const topPerformers = formatted.filter((p) => p.rating >= 4.5).length;
    const averagePerformers = formatted.filter(
      (p) => p.rating >= 3 && p.rating < 4.5
    ).length;
    const lowPerformers = formatted.filter(
      (p) => p.rating > 0 && p.rating < 3
    ).length;

    res.status(200).json({
      success: true,
      count: formatted.length,
      partners: formatted,
      stats: {
        topPerformers,
        averagePerformers,
        lowPerformers,
        totalPartners: formatted.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 📊 DELIVERY PARTNER — Get Rating Stats
// ============================================================
export const getMyRatingStats = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found",
      });
    }

    // Recent ratings (last 10)
    const recentRatings = await DeliveryRating.find({
      deliveryPartner: req.user._id,
    })
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        averageRating: partner.rating || 0,
        totalRatings: partner.totalRatings || 0,
        breakdown: partner.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        totalDeliveries: partner.totalDeliveries || 0,
        totalReturns: partner.totalReturns || 0,
      },
      recentRatings,
    });
  } catch (error) {
    next(error);
  }
};