import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Shop from "../models/Shop.js";
import {
  sendOTPEmail,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
} from "../services/email.service.js";

import {
  emitToUser,
  emitToDeliveryPartners,
  emitToNearestDeliveryPartners,
} from "../config/socket.js";

import { creditSellerWallet } from "./sellerWallet.controller.js";
import {
  isDeliveryAvailable,
  getCurrentRadius,
  getCurrentTimeWindow,
  getDeliveryCharge,
  calculateDistance,
} from "../config/delivery.config.js";

// 💳 Razorpay Service Import
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchPaymentDetails,
} from "../services/razorpay.service.js";

// 🔔 FCM Push Notification Helper
import { sendNotificationToUser } from "../utils/sendNotification.js";

// 🎲 OTP Generator — 4 digit
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// 💰 Commission rate (5%)
const COMMISSION_RATE = 5;

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (CUSTOMER)
export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMode, deliveryType, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No order items" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: "Shipping address is required" });
    }

    // 🆕 Layer 2: Google Maps Address Verification
    if (!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({
        success: false,
        message: "Complete address required (line1, city, pincode)",
      });
    }

    // 🆕 Verify address with Google (optional — fail hone par bhi order chalega)
    try {
      const { verifyAddress } = await import("../services/googleMaps.service.js");
      const fullAddress = `${shippingAddress.line1}, ${shippingAddress.city}, ${shippingAddress.pincode}`;
      const verified = await verifyAddress(fullAddress);

      if (verified) {
        if (verified.pincode && verified.pincode !== shippingAddress.pincode) {
          console.log(
            `⚠️ Pincode mismatch: user=${shippingAddress.pincode}, google=${verified.pincode}`
          );
        }
        if (verified.pincode) {
          shippingAddress.pincode = verified.pincode;
        }
        console.log(`✅ Address verified: ${verified.formattedAddress}`);
      } else {
        console.log(`⚠️ Address verification skipped (API failed)`);
      }
    } catch (err) {
      console.error("Address verification error:", err.message);
    }

    // 🆕 GPS required
    if (!shippingAddress.latitude || !shippingAddress.longitude) {
      return res.status(400).json({
        success: false,
        message: "GPS location required. Please enable location.",
      });
    }

    const orderItems = [];
    let itemsPrice = 0;

    for (const item of items) {
      const product = await Product.findById(item.product || item.id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.name}` });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units available for ${product.name}`,
        });
      }

      const finalPrice = Math.round(product.price - (product.price * product.discount) / 100);

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price: product.price,
        discount: product.discount,
        finalPrice,
        qty: item.qty,
        seller: product.seller,
        shopName: product.shopName,
      });

      itemsPrice += finalPrice * item.qty;
    }

    // 🏪 Pickup Address + Distance check
    let pickupAddress = {
      name: orderItems[0]?.shopName || "Seller",
      phone: "—",
      line1: "—",
      city: "—",
      pincode: "—",
      coordinates: [0, 0],
    };

    let maxDistance = 0;
    let pickupShop = null;

    try {
      const firstSeller = orderItems[0]?.seller;
      if (firstSeller) {
        const shop = await Shop.findOne({ owner: firstSeller });
        if (shop) {
          pickupShop = shop;
          pickupAddress = {
            name: shop.name || orderItems[0]?.shopName || "Shop",
            phone: shop.phone || "—",
            line1: shop.address?.line1 || "—",
            city: shop.address?.city || "—",
            pincode: shop.address?.pincode || "—",
            coordinates: shop.location?.coordinates || [0, 0],
          };

          if (
            shop.location?.coordinates?.[0] &&
            shippingAddress.latitude &&
            shippingAddress.longitude
          ) {
            maxDistance = calculateDistance(
              Number(shippingAddress.latitude),
              Number(shippingAddress.longitude),
              shop.location.coordinates[1],
              shop.location.coordinates[0]
            );
          }
        }
      }
    } catch (err) {
      console.error("Pickup address error:", err.message);
    }

    // 🚚 Delivery availability check
    if (maxDistance > 0) {
      const currentRadius = getCurrentRadius();
      const timeWindow = getCurrentTimeWindow();

      if (!isDeliveryAvailable(maxDistance)) {
        return res.status(400).json({
          success: false,
          message: `Abhi ${currentRadius} km tak delivery available hai (${timeWindow}). Aapka order ${maxDistance.toFixed(1)} km door hai.`,
          maxRadius: currentRadius,
          distance: Math.round(maxDistance * 10) / 10,
          timeWindow,
        });
      }
    }

    // 🚚 Delivery charge
    let deliveryCharge = 0;
    let deliveryChargeType = "free";

    if (maxDistance > 0) {
      deliveryCharge = getDeliveryCharge(maxDistance);
      deliveryChargeType = "distance";
    } else {
      deliveryCharge = itemsPrice > 500 ? 0 : 30;
      deliveryChargeType = itemsPrice > 500 ? "free" : "flat";
    }

    if (itemsPrice > 500 && deliveryCharge > 0) {
      deliveryCharge = 0;
      deliveryChargeType = "free_above_500";
    }

    const platformFee = 10;

    // 🎟️ Coupon
    let couponDiscount = 0;
    let appliedCouponCode = "";
    let couponDoc = null;

    if (couponCode) {
      try {
        couponDoc = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          isActive: true,
        });

        if (couponDoc) {
          const now = new Date();
          const isValid =
            now >= couponDoc.validFrom &&
            now <= couponDoc.validUntil &&
            couponDoc.usedCount < couponDoc.usageLimit &&
            itemsPrice >= couponDoc.minOrderValue;

          const alreadyUsed = couponDoc.usedBy.some(
            (u) => u.user.toString() === req.user._id.toString()
          );

          if (isValid && !alreadyUsed) {
            if (couponDoc.discountType === "PERCENTAGE") {
              couponDiscount = Math.round(
                (itemsPrice * couponDoc.discountValue) / 100
              );
              if (couponDoc.maxDiscount && couponDiscount > couponDoc.maxDiscount) {
                couponDiscount = couponDoc.maxDiscount;
              }
            } else {
              couponDiscount = couponDoc.discountValue;
            }
            appliedCouponCode = couponDoc.code;
          }
        }
      } catch (err) {
        console.error("Coupon error:", err.message);
      }
    }

    const totalAmount = itemsPrice + deliveryCharge + platformFee - couponDiscount;

    // 💰 Commission
    const commissionAmount = Math.round((itemsPrice * COMMISSION_RATE) / 100);
    const sellerEarning = itemsPrice - commissionAmount;
    const deliveryEarning = Math.round((deliveryCharge * 80) / 100);
    const platformRevenue =
      commissionAmount +
      (deliveryCharge - deliveryEarning) +
      platformFee;

    const chosenDeliveryType = deliveryType === "ASALIMART" ? "ASALIMART" : "SELLER";
    const otp = generateOTP();

    // 🆕 Shipping address with coordinates
    const shippingAddressWithCoords = {
      ...shippingAddress,
      coordinates: [
        Number(shippingAddress.longitude) || 0,
        Number(shippingAddress.latitude) || 0,
      ],
    };

    // 🆕 Payment details
    let paymentDetailsData = {
      method: "COD",
      status: "PENDING",
    };

    if (paymentMode === "ONLINE" && req.body.paymentDetails) {
      paymentDetailsData = {
        method: "ONLINE",
        status: "PENDING",
        transactionId: req.body.paymentDetails.transactionId || "",
        screenshot: req.body.paymentDetails.screenshot || "",
        paidTo: req.body.paymentDetails.paidTo || "",
      };
    }

   // 🆕 Razorpay payment — agar razorpay_payment_id aaya hai to PAID mark karo
if (paymentMode === "ONLINE" && req.body.razorpay_payment_id) {
  paymentDetailsData = {
    method: "ONLINE",
    status: "PAID",                                    // ✅ PAID mark karo
    transactionId: req.body.razorpay_payment_id,
    razorpayOrderId: req.body.razorpay_order_id || "",
    paidAt: new Date(),
  };
  console.log(`✅ Order will be marked PAID directly (Razorpay payment_id: ${req.body.razorpay_payment_id})`);
}

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: shippingAddressWithCoords,
      pickupAddress,
      itemsPrice,
      deliveryCharge,
      deliveryChargeType,
      platformFee,
      discount: couponDiscount,
      couponCode: appliedCouponCode,
      totalAmount,
      paymentMode: paymentMode || "COD",
      paymentDetails: paymentDetailsData,
      orderStatus: "PLACED",
      deliveryType: chosenDeliveryType,
      deliveryPartner: null,
      deliveryOTP: otp,
      deliveryOTPVerified: false,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      sellerEarning,
      deliveryEarning,
      platformRevenue,
      distance: Math.round(maxDistance * 10) / 10,
      timeWindow: getCurrentTimeWindow(),
      maxRadiusAtOrder: getCurrentRadius(),
    });

    // 🎟️ Mark coupon as used
    if (couponDoc && appliedCouponCode) {
      try {
        couponDoc.usedCount += 1;
        couponDoc.usedBy.push({ user: req.user._id });
        await couponDoc.save();
      } catch (err) {
        console.error("Coupon mark error:", err.message);
      }
    }

    // 📧 Confirmation email
    try {
      await sendOrderConfirmationEmail(req.user.email, order, req.user.name);
      console.log(`📧 Confirmation email sent → ${req.user.email}`);
    } catch (emailErr) {
      console.error("❌ Confirmation email failed:", emailErr.message);
    }

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    }

    // 🔔 SOCKET — Notify sellers
    try {
      const uniqueSellers = [...new Set(orderItems.map((i) => i.seller?.toString()).filter(Boolean))];

      uniqueSellers.forEach((sellerId) => {
        emitToUser(sellerId, "order:new", {
          orderId: order._id,
          orderNumber: order.orderNumber,
          message: `🛒 New order #${order.orderNumber}`,
          total: order.totalAmount,
          itemCount: orderItems.length,
        });
      });
    } catch (err) {
      console.error("Socket emit failed:", err.message);
    }

    // 🔔 PUSH NOTIFICATION (FCM) — Notify sellers
    try {
      const uniqueSellers = [...new Set(orderItems.map((i) => i.seller?.toString()).filter(Boolean))];
      for (const sellerId of uniqueSellers) {
        await sendNotificationToUser(
          sellerId,
          "🛒 New Order Received!",
          `Order #${order.orderNumber} - ₹${order.totalAmount}`,
          { orderId: order._id.toString(), type: "NEW_ORDER", link: "/seller/orders" }
        );
      }
    } catch (notifErr) {
      console.error("❌ Push notification failed:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("deliveryPartner", "name phone")
      .sort({ createdAt: -1 });

    const ordersWithOTP = orders.map((o) => {
      const obj = o.toObject();
      if (
        !o.deliveryOTPVerified &&
        ["SHIPPED", "OUT_FOR_DELIVERY"].includes(o.orderStatus)
      ) {
        obj.deliveryOTP = o.deliveryOTP;
      } else {
        delete obj.deliveryOTP;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: ordersWithOTP.length,
      orders: ordersWithOTP,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name images")
      .populate("deliveryPartner", "name phone");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isSeller = order.items.some(
      (i) => i.seller?.toString() === req.user._id.toString()
    );
    const isDeliveryPartner =
      order.deliveryPartner?._id?.toString() === req.user._id.toString() ||
      order.deliveryPartner?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isSeller && !isDeliveryPartner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const responseOrder = order.toObject();

    const canSeeOTP =
      isAdmin ||
      (isOwner &&
        !order.deliveryOTPVerified &&
        ["SHIPPED", "OUT_FOR_DELIVERY"].includes(order.orderStatus));

    if (!canSeeOTP) {
      delete responseOrder.deliveryOTP;
    }

    res.status(200).json({ success: true, order: responseOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customer)
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order at status: ${order.orderStatus}`,
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason || "Cancelled by user";

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
    }

    if (order.couponCode) {
      try {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode },
          {
            $inc: { usedCount: -1 },
            $pull: { usedBy: { user: order.user } },
          }
        );
      } catch (err) {
        console.error("Coupon restore error:", err.message);
      }
    }

    await order.save();

    try {
      const uniqueSellers = [...new Set(order.items.map((i) => i.seller?.toString()).filter(Boolean))];
      uniqueSellers.forEach((sellerId) => {
        emitToUser(sellerId, "order:cancelled", {
          orderId: order._id,
          orderNumber: order.orderNumber,
          message: `❌ Order #${order.orderNumber} cancelled`,
        });
      });
    } catch (err) {
      console.error("Socket emit failed:", err.message);
    }

    // 🔔 PUSH NOTIFICATION (FCM) — Notify sellers about cancellation
    try {
      const uniqueSellers = [...new Set(order.items.map((i) => i.seller?.toString()).filter(Boolean))];
      for (const sellerId of uniqueSellers) {
        await sendNotificationToUser(
          sellerId,
          "❌ Order Cancelled",
          `Order #${order.orderNumber} has been cancelled by customer`,
          { orderId: order._id.toString(), type: "ORDER_CANCELLED", link: "/seller/orders" }
        );
      }
    } catch (notifErr) {
      console.error("❌ Push notification failed:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller's orders
// @route   GET /api/orders/seller/orders
// @access  Private (SELLER)
export const getSellerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ "items.seller": req.user._id })
      .populate("deliveryPartner", "name phone")
      .sort({ createdAt: -1 });

    const filtered = orders.map((order) => {
      const obj = order.toObject();
      obj.items = obj.items.filter(
        (i) => i.seller?.toString() === req.user._id.toString()
      );
      delete obj.deliveryOTP;
      return obj;
    });

    res.status(200).json({
      success: true,
      count: filtered.length,
      orders: filtered,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Seller/Admin)
// @route   PUT /api/orders/:id/status
// @access  Private (SELLER, ADMIN)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (req.user.role !== "ADMIN") {
      const hasItems = order.items.some(
        (i) => i.seller?.toString() === req.user._id.toString()
      );
      if (!hasItems) {
        return res.status(403).json({ success: false, message: "Not authorized" });
      }
    }

    let allowedStatuses;
    if (req.user.role === "ADMIN") {
      allowedStatuses = [
        "PLACED", "CONFIRMED", "PACKED", "SHIPPED",
        "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED",
      ];
    } else if (order.deliveryType === "SELLER") {
      allowedStatuses = [
        "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "CANCELLED",
      ];
    } else {
      allowedStatuses = ["CONFIRMED", "PACKED", "CANCELLED"];
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Allowed statuses: ${allowedStatuses.join(", ")}`,
      });
    }

    if (status === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Use OTP verification to mark delivered",
      });
    }

    order.orderStatus = status;
if (status === "DELIVERED") {
  order.deliveredAt = new Date();
  // 🆕 Return Window set karo (3 ghante)
  order.returnDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000);
  order.returnStatus = "NONE";
  console.log(`🔄 Return window set: ${order.returnDeadline.toISOString()} (3 hours)`);
}
    if (
      status === "SHIPPED" &&
      order.deliveryOTP &&
      !order.deliveryOTPVerified
    ) {
      try {
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
    }

    await order.save();

    if (
      status === "PACKED" &&
      order.deliveryType === "ASALIMART" &&
      !order.deliveryPartner
    ) {
      try {
        const pickupCoords = order.pickupAddress?.coordinates;
        const pickupLat = pickupCoords?.[1] || null;
        const pickupLng = pickupCoords?.[0] || null;

        emitToNearestDeliveryPartners(
          "order:available",
          {
            orderId: order._id,
            orderNumber: order.orderNumber,
            pickup: order.pickupAddress?.name || "Shop",
            drop: `${order.shippingAddress?.city}`,
            earnings: order.deliveryEarning || 26,
            message: `🔔 New delivery available nearby!`,
          },
          { lat: pickupLat, lng: pickupLng },
          3,
          3
        );
      } catch (err) {
        console.error("Socket emit failed:", err.message);
      }
    }

    try {
      emitToUser(order.user.toString(), "order:status", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        message: `Aapka order ab ${order.orderStatus.replace(/_/g, " ")} hai`,
      });
    } catch (err) {
      console.error("Socket emit failed:", err.message);
    }

    // 🔔 PUSH NOTIFICATION (FCM) — Notify customer about status change
    try {
      await sendNotificationToUser(
        order.user.toString(),
        "📦 Order Status Updated",
        `Order #${order.orderNumber} is now ${order.orderStatus.replace(/_/g, " ")}`,
        {
          orderId: order._id.toString(),
          type: "ORDER_STATUS",
          status: order.orderStatus,
          link: `/orders/${order._id}`,
        }
      );
    } catch (notifErr) {
      console.error("❌ Push notification failed:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seller verifies OTP and marks delivered
// @route   PUT /api/orders/:id/seller-deliver
// @access  Private (SELLER)
export const sellerVerifyOTPAndDeliver = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const hasItems = order.items.some(
      (i) => i.seller?.toString() === req.user._id.toString()
    );
    if (!hasItems && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not your order" });
    }

    if (order.deliveryType !== "SELLER") {
      return res.status(400).json({
        success: false,
        message: "This order is for AsaliMart delivery partner",
      });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP required" });
    }

    if (order.deliveryOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (order.deliveryOTPVerified) {
      return res.status(400).json({ success: false, message: "Already delivered" });
    }

   order.deliveryOTPVerified = true;
order.orderStatus = "DELIVERED";
order.deliveredAt = new Date();

// 🆕 Return Window set karo (3 ghante)
order.returnDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000);
order.returnStatus = "NONE"; // Default status

console.log(`🔄 Return window set: ${order.returnDeadline.toISOString()} (3 hours)`);

await order.save();

    try {
      const uniqueSellers = [
        ...new Set(order.items.map((i) => i.seller?.toString()).filter(Boolean)),
      ];

      for (const sellerId of uniqueSellers) {
        const sellerItems = order.items.filter(
          (i) => i.seller?.toString() === sellerId
        );
        const sellerItemsPrice = sellerItems.reduce(
          (sum, i) => sum + i.finalPrice * i.qty,
          0
        );
        const commission = Math.round((sellerItemsPrice * COMMISSION_RATE) / 100);
        const earning = sellerItemsPrice - commission;

        await creditSellerWallet(sellerId, earning, order.orderNumber);
      }
    } catch (walletErr) {
      console.error("Wallet credit failed:", walletErr.message);
    }

    try {
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

    // 🔔 PUSH NOTIFICATION (FCM) — Notify customer about delivery
    try {
      await sendNotificationToUser(
        order.user.toString(),
        "✅ Order Delivered!",
        `Order #${order.orderNumber} has been delivered successfully`,
        {
          orderId: order._id.toString(),
          type: "ORDER_DELIVERED",
          link: `/orders/${order._id}`,
        }
      );
    } catch (notifErr) {
      console.error("❌ Push notification failed:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Order delivered successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order tracking (delivery partner live location)
// @route   GET /api/orders/:id/tracking
// @access  Private (Customer who owns the order)
export const getOrderTracking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("deliveryPartner", "name phone");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (!order.deliveryPartner) {
      return res.json({
        success: false,
        message: "No delivery partner assigned yet",
      });
    }

    const DeliveryPartner = (await import("../models/DeliveryPartner.js")).default;
    const partner = await DeliveryPartner.findOne({
      user: order.deliveryPartner._id,
    });

    if (!partner?.currentLocation?.coordinates) {
      return res.json({
        success: false,
        message: "Location not available",
      });
    }

    const [lng, lat] = partner.currentLocation.coordinates;

    if (lat === 0 && lng === 0) {
      return res.json({
        success: false,
        message: "Delivery partner location not updated yet",
      });
    }

    res.json({
      success: true,
      location: { lat, lng },
      partner: {
        name: order.deliveryPartner.name,
        phone: order.deliveryPartner.phone,
      },
      lastUpdated: partner.lastActiveAt,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// 💳 RAZORPAY PAYMENT INTEGRATION
// ============================================================

// @desc    Create Razorpay order (before placing order)
// @route   POST /api/orders/create-razorpay-order
// @access  Private (CUSTOMER)
export const createRazorpayOrderController = async (req, res, next) => {
  try {
    const { amount, receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // 🆕 User ID aur email notes me add karein (webhook ke liye)
    const enrichedNotes = {
      ...notes,
      userId: req.user._id.toString(),
      userEmail: req.user.email,
    };

    const result = await createRazorpayOrder(
      amount,
      receipt || `receipt_${Date.now()}`,
      enrichedNotes
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to create Razorpay order",
        error: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Razorpay order created",
      order: result.order,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/verify-payment
// @access  Private (CUSTOMER)
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification details",
      });
    }

    // Step 1: Signature verify karo
    const verification = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Step 2: Payment details fetch karo (extra security)
    const paymentResult = await fetchPaymentDetails(razorpay_payment_id);

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch payment details",
      });
    }

    const payment = paymentResult.payment;

    // Step 3: Payment status check karo
    if (payment.status !== "captured" && payment.status !== "authorized") {
      return res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${payment.status}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: payment.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};