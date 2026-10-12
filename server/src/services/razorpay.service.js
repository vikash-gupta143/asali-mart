import Razorpay from "razorpay";
import crypto from "crypto";
import { config } from "../config/env.js";

// 🔧 Razorpay Instance Initialize
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

/**
 * 💳 Create Razorpay Order
 * @param {number} amount - Amount in RUPEES (not paise)
 * @param {string} receipt - Unique receipt ID (order number)
 * @param {object} notes - Extra data (optional)
 */
export const createRazorpayOrder = async (amount, receipt, notes = {}) => {
  try {
    // Razorpay accepts amount in PAISE (₹1 = 100 paise)
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: receipt,
      notes: notes,
    };

    const order = await razorpay.orders.create(options);
    console.log(`✅ Razorpay order created: ${order.id}`);
    return { success: true, order };
  } catch (error) {
    console.error("❌ Razorpay order creation failed:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * 🔐 Verify Razorpay Payment Signature
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature
 */
export const verifyRazorpaySignature = (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  try {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpaySignature;

    if (isAuthentic) {
      console.log(`✅ Payment verified: ${razorpayPaymentId}`);
      return { success: true };
    } else {
      console.log(`❌ Payment verification failed: ${razorpayPaymentId}`);
      return { success: false, message: "Invalid signature" };
    }
  } catch (error) {
    console.error("❌ Signature verification error:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * 💰 Fetch Payment Details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 */
export const fetchPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    console.error("❌ Fetch payment failed:", error.message);
    return { success: false, message: error.message };
  }
};

/**
 * 💸 Initiate Refund
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount in RUPEES (optional, full refund if not provided)
 */
export const initiateRefund = async (paymentId, amount = null) => {
  try {
    const options = amount
      ? { amount: Math.round(amount * 100), speed: "normal" }
      : { speed: "normal" }; // Full refund

    const refund = await razorpay.payments.refund(paymentId, options);
    console.log(`✅ Refund initiated: ${refund.id}`);
    return { success: true, refund };
  } catch (error) {
    console.error("❌ Refund failed:", error.message);
    return { success: false, message: error.message };
  }
};