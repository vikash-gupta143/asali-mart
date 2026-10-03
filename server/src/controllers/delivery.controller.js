import Order from "../models/Order.js";
import User from "../models/User.js";

// 🎲 Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// @desc    Get available orders for delivery partner
// @route   GET /api/delivery/available
// @access  Private (DELIVERY_PARTNER)
export const getAvailableOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      orderStatus: { $in: ["CONFIRMED", "PACKED"] },
      deliveryPartner: null,
      deliveryType: "ASALIMART",
    })
      .populate("user", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
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

    if (!["CONFIRMED", "PACKED"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot accept order at status: ${order.orderStatus}`,
      });
    }

    // Generate OTP
    const otp = generateOTP();

    order.deliveryPartner = req.user._id;
    order.deliveryOTP = otp;
    order.deliveryOTPVerified = false;
    order.deliveryType = "ASALIMART";
    order.deliveryCharge = order.deliveryCharge || 30;
    order.deliveryEarnings = Math.round((order.deliveryCharge || 30) * 0.8); // 80% to partner
    order.orderStatus = "OUT_FOR_DELIVERY";

    await order.save();

    res.json({
      success: true,
      message: "Delivery accepted",
      order,
      // Send OTP to customer (in real app — SMS/notification)
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

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.deliveryPartner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your delivery" });
    }

    order.pickedUpAt = new Date();
    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
      order.orderStatus = "OUT_FOR_DELIVERY";
    }

    await order.save();

    res.json({ success: true, message: "Picked up", order });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and mark delivered
// @route   PUT /api/delivery/:id/deliver
// @access  Private (DELIVERY_PARTNER)
export const verifyOTPAndDeliver = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.deliveryPartner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your delivery" });
    }

    if (order.deliveryOTP !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    order.deliveryOTPVerified = true;
    order.orderStatus = "DELIVERED";
    order.deliveredAt = new Date();

    await order.save();

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