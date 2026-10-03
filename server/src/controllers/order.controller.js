import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import {
  sendOTPEmail,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
} from "../services/email.service.js";

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

    const deliveryCharge = itemsPrice > 500 ? 0 : 30;

    // 🎟️ Coupon apply karo (agar diya ho)
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

    const totalAmount = itemsPrice + deliveryCharge - couponDiscount;

    // 💰 Commission calculate karo
    const commissionAmount = Math.round((totalAmount * COMMISSION_RATE) / 100);
    const sellerEarnings = totalAmount - commissionAmount;

    const chosenDeliveryType = deliveryType === "ASALIMART" ? "ASALIMART" : "SELLER";

    // 🎲 OTP generate — HAMESHA (SELLER + ASALIMART dono me)
    const otp = generateOTP();

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      itemsPrice,
      deliveryCharge,
      discount: couponDiscount,
      couponCode: appliedCouponCode,
      totalAmount,
      paymentMode: paymentMode || "COD",
      orderStatus: "PLACED",
      deliveryType: chosenDeliveryType,
      deliveryPartner: null,
      deliveryOTP: otp,
      deliveryOTPVerified: false,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      sellerEarnings,
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

    // 📧 Order confirmation email (non-blocking)
    try {
      await sendOrderConfirmationEmail(req.user.email, order, req.user.name);
      console.log(`📧 Confirmation email sent → ${req.user.email}`);
    } catch (emailErr) {
      console.error("❌ Confirmation email failed:", emailErr.message);
    }

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
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

    // ✅ Customer ko OTP dikhao — sirf SHIPPED / OUT_FOR_DELIVERY me
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

    // ✅ OTP visibility — SIRF Customer aur Admin ko
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
// @access  Private (Customer who placed it)
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

    // 🎟️ Coupon restore karo
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

      // ❌ Seller ko OTP NAHI dikhana
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
    if (status === "DELIVERED") order.deliveredAt = new Date();

    // 📧 SHIPPED pe OTP email
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

    await order.save();

    // 📧 Delivered email to customer
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

    res.status(200).json({
      success: true,
      message: "Order delivered successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};