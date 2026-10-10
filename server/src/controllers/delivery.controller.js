import Order from "../models/Order.js";
import User from "../models/User.js";
import { emitToUser } from "../config/socket.js";
import {
  calculateDistance,
  getCurrentRadius,
} from "../config/delivery.config.js";

// 🎲 Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// @desc    Get available orders for delivery partner
// @route   GET /api/delivery/available
// @access  Private (DELIVERY_PARTNER)
export const getAvailableOrders = async (req, res, next) => {
  try {
    const { lat, lng, pincode } = req.query;

    const query = {
      orderStatus: "PACKED",
      deliveryPartner: null,
      deliveryType: "ASALIMART",
    };

    if (pincode && pincode.length === 6) {
      query["shippingAddress.pincode"] = pincode;
    }

    const orders = await Order.find(query)
      .populate("user", "name phone")
      .sort({ createdAt: -1 });

    const ordersWithDistance = orders.map((order) => {
      let distance = 0;

      const pickupCoords = order.pickupAddress?.coordinates;
      const dropCoords = order.shippingAddress?.coordinates;

      if (
        pickupCoords &&
        dropCoords &&
        pickupCoords[0] !== 0 &&
        pickupCoords[1] !== 0 &&
        dropCoords[0] !== 0 &&
        dropCoords[1] !== 0
      ) {
        distance = calculateDistance(
          pickupCoords[1],
          pickupCoords[0],
          dropCoords[1],
          dropCoords[0]
        );
      }

      return {
        ...order.toObject(),
        distance: Math.round(distance * 10) / 10,
      };
    });

    let filteredOrders = ordersWithDistance;
    if (lat && lng) {
      const maxRadius = getCurrentRadius();
      filteredOrders = ordersWithDistance.filter((order) => {
        const dropCoords = order.shippingAddress?.coordinates;
        if (!dropCoords || dropCoords[0] === 0 || dropCoords[1] === 0) return true;

        const distFromPartner = calculateDistance(
          Number(lat),
          Number(lng),
          dropCoords[1],
          dropCoords[0]
        );
        return distFromPartner <= maxRadius;
      });
    }

    res.json({
      success: true,
      count: filteredOrders.length,
      orders: filteredOrders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept delivery order
// @route   PUT /api/delivery/:id/accept
// @access  Private (DELIVERY_PARTNER)
export const acceptDelivery = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.deliveryPartner) {
      return res.status(400).json({
        success: false,
        message: "Order already assigned to another partner",
      });
    }

    if (order.orderStatus !== "PACKED") {
      return res.status(400).json({
        success: false,
        message: `Cannot accept order at status: ${order.orderStatus}`,
      });
    }

    const pickupCoords = order.pickupAddress?.coordinates;
    const dropCoords = order.shippingAddress?.coordinates;
    let distance = 0;

    if (
      pickupCoords &&
      dropCoords &&
      pickupCoords[0] !== 0 &&
      pickupCoords[1] !== 0 &&
      dropCoords[0] !== 0 &&
      dropCoords[1] !== 0
    ) {
      distance = calculateDistance(
        pickupCoords[1],
        pickupCoords[0],
        dropCoords[1],
        dropCoords[0]
      );
    }

    const maxRadius = getCurrentRadius();

    if (distance > maxRadius) {
      return res.status(400).json({
        success: false,
        message: `Ye order ${distance.toFixed(1)} km door hai. Abhi sirf ${maxRadius} km tak ke orders accept kar sakte hain.`,
        distance: Math.round(distance * 10) / 10,
        maxRadius,
      });
    }

    if (distance >= 8 && distance <= 10) {
      console.log(
        `⚠️ Far delivery accepted: ${order.orderNumber} — ${distance.toFixed(1)} km by ${req.user.name}`
      );
    }

    const otp = generateOTP();

    order.deliveryPartner = req.user._id;
    order.deliveryOTP = otp;
    order.deliveryOTPVerified = false;
    order.deliveryType = "ASALIMART";
    order.deliveryCharge = order.deliveryCharge || 30;
    order.deliveryEarnings = Math.round((order.deliveryCharge || 30) * 0.8);
    order.orderStatus = "OUT_FOR_DELIVERY";
    order.distance = Math.round(distance * 10) / 10;

    await order.save();

    try {
      emitToUser(order.user.toString(), "order:accepted", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: "OUT_FOR_DELIVERY",
        message: `🚚 Aapka order nikal gaya!`,
        deliveryPartner: {
          name: req.user.name,
          phone: req.user.phone || "—",
        },
      });
      console.log(`🔔 Customer notified — order accepted: ${order.orderNumber}`);
    } catch (err) {
      console.error("Socket emit failed:", err.message);
    }

    try {
      const { sendOTPEmail } = await import("../services/email.service.js");
      const customer = await Order.findById(order._id).populate(
        "user",
        "name email"
      );
      if (customer?.user?.email) {
        await sendOTPEmail(
          customer.user.email,
          order.deliveryOTP,
          order.orderNumber,
          customer.user.name
        );
        console.log(`📧 OTP email sent → ${customer.user.email}`);
      }
    } catch (emailErr) {
      console.error("❌ OTP email failed:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Delivery accepted",
      order,
      deliveryOTP: otp,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark picked up
// @route   PUT /api/delivery/:id/pickup
// @access  Private (DELIVERY_PARTNER)
export const markPickedUp = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.deliveryPartner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your delivery" });
    }

    order.pickedUpAt = new Date();
    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
      order.orderStatus = "OUT_FOR_DELIVERY";
    }

    await order.save();

    try {
      emitToUser(order.user.toString(), "order:pickedup", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: "OUT_FOR_DELIVERY",
        message: `📦 Aapka order pickup ho gaya!`,
      });
    } catch (err) {
      console.error("Socket emit failed:", err.message);
    }

    res.json({ success: true, message: "Picked up", order });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ✅ VERIFY OTP AND DELIVER (UPDATED)
// ============================================
// @desc    Verify OTP and mark delivered
// @route   PUT /api/delivery/:id/deliver
// @access  Private (DELIVERY_PARTNER)
export const verifyOTPAndDeliver = async (req, res, next) => {
  try {
    const { otp, paymentMethod } = req.body; // 🆕 paymentMethod
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.deliveryPartner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your delivery" });
    }

    if (order.deliveryOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (order.deliveryOTPVerified) {
      return res.status(400).json({ success: false, message: "Already delivered" });
    }

    // 🆕 Validate paymentMethod
    if (!paymentMethod || !["CASH", "UPI", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method select karein (CASH/UPI/ONLINE)",
      });
    }

    order.deliveryOTPVerified = true;
    order.orderStatus = "DELIVERED";
    order.deliveredAt = new Date();

    // 🆕 Payment collection record
    order.paymentCollection = {
      method: paymentMethod,
      collectedAt: new Date(),
      collectedBy: req.user._id,
      amount: order.totalAmount,
    };

    await order.save();

    // ============================================
    // 💰 DELIVERY PARTNER WALLET UPDATE
    // ============================================
    try {
      const DeliveryPartner = (await import("../models/DeliveryPartner.js")).default;
      const partner = await DeliveryPartner.findOne({ user: req.user._id });

      if (partner) {
        const deliveryEarning = order.deliveryEarnings || order.deliveryEarning || 24;
        const platformDues = order.totalAmount - deliveryEarning;

        console.log(`\n💰 Updating Delivery Partner Wallet`);
        console.log(`   Partner: ${partner.fullName}`);
        console.log(`   Delivery Earning: ₹${deliveryEarning}`);
        console.log(`   Order Total: ₹${order.totalAmount}`);
        console.log(`   Platform Dues: ₹${platformDues}`);
        console.log(`   Payment Method: ${paymentMethod}`);

        // 1. Wallet Balance (delivery earning)
        partner.walletBalance = (partner.walletBalance || 0) + deliveryEarning;
        partner.totalEarnings = (partner.totalEarnings || 0) + deliveryEarning;
        partner.totalDeliveries = (partner.totalDeliveries || 0) + 1;

        // 2. COD Cash handling (sirf jab cash ya UPI collect kiya ho)
        if (order.paymentMode === "COD" && paymentMethod !== "ONLINE") {
          partner.cashInHand = (partner.cashInHand || 0) + order.totalAmount;
          partner.platformDues = (partner.platformDues || 0) + platformDues;

          if (!partner.transactions) partner.transactions = [];

          partner.transactions.push({
            type: "CASH_COLLECTED",
            amount: order.totalAmount,
            orderId: order._id,
            orderNumber: order.orderNumber,
            description: `${paymentMethod} collected from customer (#${order.orderNumber})`,
            status: "COMPLETED",
            at: new Date(),
          });

          partner.transactions.push({
            type: "PLATFORM_DUES",
            amount: platformDues,
            orderId: order._id,
            orderNumber: order.orderNumber,
            description: `Platform dues for #${order.orderNumber}`,
            status: "COMPLETED",
            at: new Date(),
          });
        }

        // 3. Delivery earning transaction
        if (!partner.transactions) partner.transactions = [];
        partner.transactions.push({
          type: "DELIVERY_EARNING",
          amount: deliveryEarning,
          orderId: order._id,
          orderNumber: order.orderNumber,
          description: `Earning for #${order.orderNumber}`,
          status: "COMPLETED",
          at: new Date(),
        });

        await partner.save();

        console.log(`✅ Wallet Updated!`);
        console.log(`   New Balance: ₹${partner.walletBalance}`);
        console.log(`   Cash in Hand: ₹${partner.cashInHand}`);
        console.log(`   Platform Dues: ₹${partner.platformDues}\n`);
      } else {
        console.log("❌ Delivery partner profile not found");
      }
    } catch (walletErr) {
      console.error("❌ Delivery wallet update failed:", walletErr.message);
    }

    // ============================================
    // 💰 CREDIT SELLER WALLET
    // ============================================
    try {
      const { creditSellerWallet } = await import(
        "./sellerWallet.controller.js"
      );

      const uniqueSellers = [
        ...new Set(
          order.items.map((i) => i.seller?.toString()).filter(Boolean)
        ),
      ];

      for (const sellerId of uniqueSellers) {
        const sellerItems = order.items.filter(
          (i) => i.seller?.toString() === sellerId
        );
        const sellerItemsPrice = sellerItems.reduce(
          (sum, i) => sum + i.finalPrice * i.qty,
          0
        );
        const commission = Math.round((sellerItemsPrice * 5) / 100);
        const earning = sellerItemsPrice - commission;

        await creditSellerWallet(sellerId, earning, order.orderNumber);
        console.log(
          `💰 Seller ${sellerId} credited ₹${earning} for order ${order.orderNumber}`
        );
      }
    } catch (walletErr) {
      console.error("Seller wallet credit failed:", walletErr.message);
    }

    // 🔔 SOCKET — Notify customer delivered
    try {
      emitToUser(order.user.toString(), "order:delivered", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: "DELIVERED",
        message: `✅ Aapka order deliver ho gaya!`,
      });
    } catch (err) {
      console.error("Socket emit failed:", err.message);
    }

    // 📧 Delivered email
    try {
      const { sendOrderDeliveredEmail } = await import(
        "../services/email.service.js"
      );
      const customer = await Order.findById(order._id).populate(
        "user",
        "name email"
      );
      if (customer?.user?.email) {
        await sendOrderDeliveredEmail(
          customer.user.email,
          order,
          customer.user.name
        );
        console.log(`📧 Delivered email sent → ${customer.user.email}`);
      }
    } catch (emailErr) {
      console.error("❌ Delivered email failed:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Order delivered successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my deliveries
// @route   GET /api/delivery/my-deliveries
// @access  Private (DELIVERY_PARTNER)
export const getMyDeliveries = async (req, res, next) => {
  try {
    const orders = await Order.find({ deliveryPartner: req.user._id })
      .populate("user", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my earnings
// @route   GET /api/delivery/earnings
// @access  Private (DELIVERY_PARTNER)
export const getEarnings = async (req, res, next) => {
  try {
    const deliveries = await Order.find({
      deliveryPartner: req.user._id,
      orderStatus: "DELIVERED",
    });

    const totalEarnings = deliveries.reduce(
      (sum, o) => sum + (o.deliveryEarnings || 0),
      0
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeliveries = deliveries.filter(
      (o) => new Date(o.deliveredAt) >= today
    );
    const todayEarnings = todayDeliveries.reduce(
      (sum, o) => sum + (o.deliveryEarnings || 0),
      0
    );

    res.json({
      success: true,
      totalEarnings,
      todayEarnings,
      totalDeliveries: deliveries.length,
      todayDeliveries: todayDeliveries.length,
      deliveries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register as delivery partner
// @route   POST /api/delivery/register
// @access  Private
export const registerAsDeliveryPartner = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.role === "DELIVERY_PARTNER") {
      return res.status(400).json({
        success: false,
        message: "Already a delivery partner",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({
        success: false,
        message: "Admin cannot be delivery partner",
      });
    }

    user.role = "DELIVERY_PARTNER";
    await user.save();

    res.json({
      success: true,
      message: "You are now a delivery partner!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update location & availability
// @route   PUT /api/delivery-partners/location
// @access  Private (DELIVERY_PARTNER)
export const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, isAvailable } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const DeliveryPartner = (await import("../models/DeliveryPartner.js")).default;
    const partner = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found",
      });
    }

    if (partner.status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Your account is not approved yet",
      });
    }

    partner.currentLocation = {
      type: "Point",
      coordinates: [Number(lng), Number(lat)],
    };
    partner.lastActiveAt = new Date();
    if (typeof isAvailable === "boolean") {
      partner.isAvailable = isAvailable;
    }

    await partner.save();

    res.json({
      success: true,
      message: "Location updated",
      location: partner.currentLocation,
      isAvailable: partner.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle availability
// @route   PUT /api/delivery-partners/availability
// @access  Private (DELIVERY_PARTNER)
export const toggleAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    const DeliveryPartner = (await import("../models/DeliveryPartner.js")).default;
    const partner = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    partner.isAvailable = !!isAvailable;
    partner.lastActiveAt = new Date();
    await partner.save();

    res.json({
      success: true,
      message: `You are ${partner.isAvailable ? "Online" : "Offline"}`,
      isAvailable: partner.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby available delivery partners
// @route   GET /api/delivery-partners/nearby
// @access  Private (SELLER, ADMIN)
export const getNearbyPartners = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const DeliveryPartner = (await import("../models/DeliveryPartner.js")).default;
    const partners = await DeliveryPartner.find({
      status: "APPROVED",
      isAvailable: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius) * 1000,
        },
      },
    })
      .populate("user", "name email phone")
      .limit(20);

    res.json({
      success: true,
      count: partners.length,
      partners,
    });
  } catch (error) {
    next(error);
  }
};