import crypto from "crypto";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { config } from "../config/env.js";
import { sendNotificationToUser } from "../utils/sendNotification.js";
import { emitToUser } from "../config/socket.js";

/**
 * 🔔 Razorpay Webhook Handler
 * @route   POST /api/webhooks/razorpay
 * @access  Public (Razorpay calls this)
 */
export const razorpayWebhook = async (req, res) => {
  try {
    // Step 1: Signature verify karo
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = config.razorpay.webhookSecret;

    if (!req.body || (req.body.length !== undefined && req.body.length === 0)) {
      console.log("⚠️ Webhook: Empty body received");
      return res.status(400).json({ success: false, message: "Empty body" });
    }

    if (!webhookSignature) {
      console.log("⚠️ Webhook: No signature header");
      return res.status(400).json({ success: false, message: "No signature" });
    }

    if (!webhookSecret) {
      console.log("⚠️ Webhook: No webhook secret configured");
      return res
        .status(500)
        .json({ success: false, message: "Webhook secret not set" });
    }

    const rawBody = req.body.toString("utf8");

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      console.log("❌ Webhook: Invalid signature");
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    console.log("✅ Webhook: Signature verified");

    const body = JSON.parse(rawBody);
    const event = body.event;
    const payload = body.payload;

    console.log(`🔔 Webhook event: ${event}`);

    switch (event) {
      case "payment.captured":
      case "payment.authorized":
        await handlePaymentSuccess(payload.payment.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(payload.payment.entity);
        break;

      case "refund.processed":
        await handleRefundProcessed(payload.refund.entity);
        break;

      case "order.paid":
        await handleOrderPaid(payload.order.entity);
        break;

      default:
        console.log(`ℹ️ Unhandled event: ${event}`);
    }

    res.status(200).json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// 📋 HELPER — Find Pending Order
// ============================================================
const findPendingOrder = async (
  notes,
  logPrefix = "",
  amount = null,
  razorpayOrderId = null
) => {
  const userId = notes.userId;
  const orderId = notes.orderId;

  let order = null;

  // Case 1: Direct orderId in notes
  if (orderId) {
    order = await Order.findById(orderId);
    if (order) {
      console.log(
        `${logPrefix}🔍 Found order via orderId: ${order.orderNumber}`
      );
      return order;
    }
  }

  // Case 2: userId se last pending order (last 15 min)
  if (!order && userId) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    order = await Order.findOne({
      user: userId,
      orderStatus: "PLACED",
      "paymentDetails.status": { $ne: "PAID" },
      createdAt: { $gte: fifteenMinutesAgo },
    }).sort({ createdAt: -1 });

    if (order) {
      console.log(
        `${logPrefix}🔍 Found pending order via userId: ${order.orderNumber}`
      );
      return order;
    }
  }

  // Case 3: Amount se match karo
  if (!order && amount) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const amountInRupees = Math.round(amount);

    order = await Order.findOne({
      totalAmount: { $gte: amountInRupees - 1, $lte: amountInRupees + 1 },
      orderStatus: "PLACED",
      "paymentDetails.status": { $ne: "PAID" },
      createdAt: { $gte: fifteenMinutesAgo },
    })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    if (order) {
      console.log(
        `${logPrefix}🎯 Found pending order via AMOUNT match: ${order.orderNumber} (₹${order.totalAmount})`
      );
      return order;
    }
  }

  return order;
};

// ============================================================
// 📋 WEBHOOK EVENT HANDLERS
// ============================================================

/**
 * ✅ Payment Successful Handler
 */
const handlePaymentSuccess = async (payment) => {
  try {
    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;
    const amount = payment.amount / 100;
    const notes = payment.notes || {};

    console.log(`💰 Payment Success: ${razorpayPaymentId} - ₹${amount}`);

    // 🆕 Amount aur razorpayOrderId pass karo
    const order = await findPendingOrder(
      notes,
      "[payment.captured] ",
      amount,
      razorpayOrderId
    );

    if (!order) {
      console.log(`⚠️ No matching order found for payment ${razorpayPaymentId}`);
      console.log(`   userId: ${notes.userId || "Not provided"}`);
      console.log(`   orderId: ${notes.orderId || "Not provided"}`);
      console.log(`   amount: ₹${amount}`);
      return;
    }

    if (order.paymentDetails.status !== "PAID") {
      order.paymentDetails = {
        ...order.paymentDetails,
        method: "ONLINE",
        status: "PAID",
        transactionId: razorpayPaymentId,
        razorpayOrderId: razorpayOrderId,
        paidAt: new Date(),
      };
      await order.save();

      console.log(
        `✅ Order ${order.orderNumber} marked as PAID via payment.captured`
      );

      if (order.user) {
        try {
          await sendNotificationToUser(
            order.user.toString(),
            "💳 Payment Confirmed",
            `Your payment of ₹${amount} for order #${order.orderNumber} has been confirmed.`,
            {
              orderId: order._id.toString(),
              type: "PAYMENT_CONFIRMED",
              link: `/orders/${order._id}`,
            }
          );

          emitToUser(order.user.toString(), "order:payment", {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: "PAID",
            message: `💳 Payment confirmed!`,
          });
        } catch (notifErr) {
          console.error("Notification failed:", notifErr.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ handlePaymentSuccess error:", error.message);
  }
};

/**
 * ❌ Payment Failed Handler
 */
const handlePaymentFailed = async (payment) => {
  try {
    const razorpayPaymentId = payment.id;
    const errorDescription = payment.error_description || "Payment failed";
    const notes = payment.notes || {};
    const userId = notes.userId;

    console.log(`❌ Payment Failed: ${razorpayPaymentId}`);
    console.log(`   Reason: ${errorDescription}`);

    if (userId) {
      try {
        await sendNotificationToUser(
          userId,
          "❌ Payment Failed",
          `Your payment of ₹${payment.amount / 100} failed. Reason: ${errorDescription}`,
          {
            type: "PAYMENT_FAILED",
            link: "/cart",
          }
        );
      } catch (notifErr) {
        console.error("Notification failed:", notifErr.message);
      }
    }
  } catch (error) {
    console.error("❌ handlePaymentFailed error:", error.message);
  }
};

/**
 * 💸 Refund Processed Handler
 */
const handleRefundProcessed = async (refund) => {
  try {
    const refundId = refund.id;
    const paymentId = refund.payment_id;
    const amount = refund.amount / 100;

    console.log(`💸 Refund Processed: ${refundId} - ₹${amount}`);

    const order = await Order.findOne({
      "paymentDetails.transactionId": paymentId,
    });

    if (order) {
      order.paymentDetails.refundId = refundId;
      order.paymentDetails.refundedAt = new Date();
      order.paymentDetails.refundStatus = "COMPLETED";
      await order.save();

      console.log(`✅ Refund recorded for order ${order.orderNumber}`);

      if (order.user) {
        try {
          await sendNotificationToUser(
            order.user.toString(),
            "💸 Refund Processed",
            `Your refund of ₹${amount} for order #${order.orderNumber} has been processed.`,
            {
              orderId: order._id.toString(),
              type: "REFUND_PROCESSED",
              link: `/orders/${order._id}`,
            }
          );
        } catch (notifErr) {
          console.error("Notification failed:", notifErr.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ handleRefundProcessed error:", error.message);
  }
};

/**
 * 🎉 Order Paid Handler
 */
const handleOrderPaid = async (order) => {
  try {
    const razorpayOrderId = order.id;
    const amount = order.amount / 100;
    const notes = order.notes || {};

    console.log(`🎉 Order Paid: ${razorpayOrderId} - ₹${amount}`);

    // 🆕 Amount aur razorpayOrderId pass karo
    const dbOrder = await findPendingOrder(
      notes,
      "[order.paid] ",
      amount,
      razorpayOrderId
    );

    if (!dbOrder) {
      console.log(
        `⚠️ No matching order found for Razorpay order ${razorpayOrderId}`
      );
      console.log(`   userId: ${notes.userId || "Not provided"}`);
      console.log(`   amount: ₹${amount}`);
      return;
    }

    if (dbOrder.paymentDetails.status !== "PAID") {
      dbOrder.paymentDetails = {
        ...dbOrder.paymentDetails,
        method: "ONLINE",
        status: "PAID",
        razorpayOrderId: razorpayOrderId,
        paidAt: new Date(),
      };
      await dbOrder.save();

      console.log(
        `✅ Order ${dbOrder.orderNumber} marked as PAID via order.paid`
      );

      if (dbOrder.user) {
        try {
          await sendNotificationToUser(
            dbOrder.user.toString(),
            "💳 Payment Confirmed",
            `Your payment of ₹${amount} for order #${dbOrder.orderNumber} has been confirmed.`,
            {
              orderId: dbOrder._id.toString(),
              type: "PAYMENT_CONFIRMED",
              link: `/orders/${dbOrder._id}`,
            }
          );

          emitToUser(dbOrder.user.toString(), "order:payment", {
            orderId: dbOrder._id,
            orderNumber: dbOrder.orderNumber,
            status: "PAID",
            message: `💳 Payment confirmed!`,
          });
        } catch (notifErr) {
          console.error("Notification failed:", notifErr.message);
        }
      }
    }
  } catch (error) {
    console.error("❌ handleOrderPaid error:", error.message);
  }
};