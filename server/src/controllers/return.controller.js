import Return from "../models/Return.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { config } from "../config/env.js";
import { sendNotificationToUser } from "../utils/sendNotification.js";
import { emitToUser } from "../config/socket.js";
import { initiateRefund } from "../services/razorpay.service.js";
import { creditSellerWallet } from "./sellerWallet.controller.js";

// 🎲 OTP Generator
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// ============================================================
// 🛒 CUSTOMER — Create Return Request
// ============================================================
export const createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, itemId, reason, reasonText, images, type } = req.body;

    if (!orderId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Order ID aur reason zaroori hai",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Yeh aapka order nahi hai",
      });
    }

    if (order.orderStatus !== "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Sirf delivered orders return kar sakte hain",
      });
    }

    if (order.returnDeadline && new Date() > order.returnDeadline) {
      return res.status(400).json({
        success: false,
        message: "Return window khatam ho gayi",
      });
    }

    if (order.returnStatus && order.returnStatus !== "NONE") {
      return res.status(400).json({
        success: false,
        message: "Is order ke liye already return request hai",
      });
    }

    let returnItem = null;
    if (itemId) {
      returnItem = order.items.find(
        (i) => i._id.toString() === itemId || i.product.toString() === itemId
      );
    } else {
      returnItem = order.items[0];
    }

    if (!returnItem) {
      return res.status(400).json({
        success: false,
        message: "Item not found in order",
      });
    }

    const refundAmount = returnItem.finalPrice * returnItem.qty;

    const newReturn = await Return.create({
      order: order._id,
      user: req.user._id,
      seller: returnItem.seller,
      item: {
        product: returnItem.product,
        name: returnItem.name,
        image: returnItem.image,
        qty: returnItem.qty,
        finalPrice: returnItem.finalPrice,
      },
      reason,
      reasonText: reasonText || "",
      images: images || [],
      type: type || "REFUND",
      refundAmount,
      refundMethod: order.paymentMode === "COD" ? "COD_CASH" : "RAZORPAY",
      status: "REQUESTED",
      returnDeadline: order.returnDeadline,
    });

    order.returnStatus = "REQUESTED";
    order.returnInfo = {
      returnId: newReturn._id,
      reason,
      type: type || "REFUND",
      refundAmount,
      refundMethod: order.paymentMode === "COD" ? "COD_CASH" : "RAZORPAY",
      requestedAt: new Date(),
    };
    await order.save();

    console.log(`✅ Return request created: ${newReturn._id}`);

    try {
      await sendNotificationToUser(
        returnItem.seller.toString(),
        "🔄 New Return Request",
        `Order #${order.orderNumber} ke liye return request aayi hai`,
        {
          returnId: newReturn._id.toString(),
          orderId: order._id.toString(),
          type: "RETURN_REQUESTED",
          link: `/seller/returns`,
        }
      );

      emitToUser(returnItem.seller.toString(), "return:new", {
        returnId: newReturn._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        message: `🔄 New return request!`,
      });
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Return request successfully create ho gayi",
      return: newReturn,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 👤 CUSTOMER — Get My Returns
// ============================================================
export const getMyReturns = async (req, res, next) => {
  try {
    const returns = await Return.find({ user: req.user._id })
      .populate("order", "orderNumber totalAmount")
      .populate("seller", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: returns.length,
      returns,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 📦 Get Return By ID
// ============================================================
export const getReturnById = async (req, res, next) => {
  try {
    const returnDoc = await Return.findById(req.params.id)
      .populate("order", "orderNumber totalAmount orderStatus")
      .populate("user", "name email phone")
      .populate("seller", "name email phone")
      .populate("pickupPartner", "name phone");

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }

    const isOwner = returnDoc.user._id.toString() === req.user._id.toString();
    const isSeller = returnDoc.seller._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,
      return: returnDoc,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 🏪 SELLER — Get Seller Returns
// ============================================================
export const getSellerReturns = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { seller: req.user._id };
    if (status && status !== "ALL") {
      query.status = status;
    }

    const returns = await Return.find(query)
      .populate("order", "orderNumber totalAmount orderStatus deliveredAt")
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    const totalPending = await Return.countDocuments({
      seller: req.user._id,
      status: "REQUESTED",
    });

    res.status(200).json({
      success: true,
      count: returns.length,
      returns,
      stats: {
        totalPending,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 🚀 HELPER — Auto Assign Pickup (4 km Fixed Radius)
// ============================================================
const triggerAutoAssign = async (returnId, attemptNumber = 1) => {
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 5 * 60 * 1000;
  const SEARCH_RADIUS = 4000; // 4 km

  try {
    console.log(
      `🚀 Auto-assign attempt ${attemptNumber}/${MAX_ATTEMPTS} (radius: 4 km)...`
    );

    const returnDoc = await Return.findById(returnId)
      .populate("order", "orderNumber shippingAddress")
      .populate("user", "name phone")
      .populate("seller", "name phone email");

    if (!returnDoc) {
      console.log(`⚠️ Auto-assign: Return not found`);
      return;
    }

    if (returnDoc.status !== "APPROVED") {
      console.log(`⚠️ Auto-assign skipped: status is ${returnDoc.status}`);
      return;
    }

    const customerCoords = returnDoc.order?.shippingAddress?.coordinates;
    const customerLat = customerCoords?.[1];
    const customerLng = customerCoords?.[0];

    if (!customerLat || !customerLng) {
      console.log(`⚠️ Auto-assign skipped: no customer location`);
      return;
    }

    const DeliveryPartner = (await import("../models/DeliveryPartner.js")).default;

    console.log(`   📍 Searching partners within 4 km...`);

    const nearbyPartners = await DeliveryPartner.find({
      status: "APPROVED",
      isAvailable: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [customerLng, customerLat],
          },
          $maxDistance: SEARCH_RADIUS,
        },
      },
    })
      .populate("user", "name phone email")
      .limit(5);

    if (nearbyPartners.length === 0) {
      console.log(`⚠️ Attempt ${attemptNumber}: Koi partner nahi mila (4 km)`);

      if (attemptNumber < MAX_ATTEMPTS) {
        console.log(
          `⏳ Retry ${attemptNumber + 1}/${MAX_ATTEMPTS} in 5 min (same 4 km)...`
        );

        setTimeout(() => {
          triggerAutoAssign(returnId, attemptNumber + 1);
        }, RETRY_DELAY_MS);

        if (attemptNumber === 1) {
          try {
            const admins = await User.find({ role: "ADMIN" }).select("_id");
            for (const admin of admins) {
              await sendNotificationToUser(
                admin._id.toString(),
                "⚠️ Return Pickup Alert",
                `Return #${returnDoc._id.toString().slice(-6).toUpperCase()} ke liye 4 km me koi delivery partner nahi mila. Retry chal raha hai...`,
                {
                  returnId: returnDoc._id.toString(),
                  type: "RETURN_PICKUP_ALERT",
                  link: `/admin/returns`,
                }
              );
            }
            console.log(`✅ Admin ko alert bheja`);
          } catch (notifErr) {
            console.error("Admin notification failed:", notifErr.message);
          }
        }
      } else {
        console.log(`🚨 Auto-assign FAILED after ${MAX_ATTEMPTS} attempts!`);

        try {
          await sendNotificationToUser(
            returnDoc.seller._id.toString(),
            "🚨 Return Pickup Failed",
            `Automatic pickup assign nahi ho paya. Admin manually handle karega.`,
            {
              returnId: returnDoc._id.toString(),
              type: "RETURN_PICKUP_FAILED",
              link: `/seller/returns`,
            }
          );

          const admins = await User.find({ role: "ADMIN" }).select("_id");
          for (const admin of admins) {
            await sendNotificationToUser(
              admin._id.toString(),
              "🚨 URGENT: Return Pickup Failed",
              `Return #${returnDoc._id.toString().slice(-6).toUpperCase()} — 4 km me koi partner nahi mila. Manual assign karein.`,
              {
                returnId: returnDoc._id.toString(),
                type: "RETURN_PICKUP_FAILED",
                link: `/admin/returns`,
              }
            );
          }
          console.log(`🚨 Admin + Seller ko final alert bheja`);
        } catch (notifErr) {
          console.error("Final notification failed:", notifErr.message);
        }
      }

      return;
    }

    const pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();

    returnDoc.status = "PICKUP_SCHEDULED";
    returnDoc.pickupScheduledAt = new Date();
    returnDoc.pickupOTP = pickupOTP;
    await returnDoc.save();

    await Order.findByIdAndUpdate(returnDoc.order._id, {
      returnStatus: "PICKUP_SCHEDULED",
    });

    for (const partner of nearbyPartners) {
      if (!partner.user?._id) continue;

      try {
        await sendNotificationToUser(
          partner.user._id.toString(),
          "📦 New Return Pickup",
          `Aapke area me return pickup available hai (${returnDoc.item?.name})`,
          {
            returnId: returnDoc._id.toString(),
            type: "RETURN_PICKUP_AVAILABLE",
            link: `/delivery/returns`,
          }
        );

        emitToUser(partner.user._id.toString(), "return:available", {
          returnId: returnDoc._id,
          orderNumber: returnDoc.order?.orderNumber,
          itemName: returnDoc.item?.name,
          earnings: 30,
          message: `📦 New return pickup available!`,
        });
      } catch (err) {
        console.error(`Notification failed:`, err.message);
      }
    }

    try {
      await sendNotificationToUser(
        returnDoc.user._id.toString(),
        "🚚 Pickup Scheduled",
        `Aapka return pickup schedule ho gaya. Pickup OTP: ${pickupOTP}`,
        {
          returnId: returnDoc._id.toString(),
          type: "RETURN_PICKUP_SCHEDULED",
          link: `/returns/${returnDoc._id}`,
        }
      );
    } catch (notifErr) {
      console.error("Customer notification failed:", notifErr.message);
    }

    console.log(
      `✅ AUTO-ASSIGN successful (attempt ${attemptNumber}): ${nearbyPartners.length} partners ko notification (4 km)`
    );
  } catch (error) {
    console.error(`❌ Auto-assign attempt ${attemptNumber} error:`, error.message);
  }
};

// ============================================================
// ✅ SELLER/ADMIN — Approve Return
// ============================================================
export const approveReturn = async (req, res, next) => {
  try {
    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }

    const isSeller = returnDoc.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (returnDoc.status !== "REQUESTED") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve return at status: ${returnDoc.status}`,
      });
    }

    returnDoc.status = "APPROVED";
    returnDoc.approvedAt = new Date();
    await returnDoc.save();

    await Order.findByIdAndUpdate(returnDoc.order, {
      returnStatus: "APPROVED",
    });

    console.log(`✅ Return approved: ${returnDoc._id}`);

    try {
      await sendNotificationToUser(
        returnDoc.user.toString(),
        "✅ Return Approved",
        `Aapka return request approve ho gaya. Delivery boy jaldi aayega.`,
        {
          returnId: returnDoc._id.toString(),
          type: "RETURN_APPROVED",
          link: `/returns/${returnDoc._id}`,
        }
      );

      emitToUser(returnDoc.user.toString(), "return:approved", {
        returnId: returnDoc._id,
        message: `✅ Return approved!`,
      });
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    // 🚀 AUTO-ASSIGN — 5 second baad automatic
    setTimeout(() => {
      triggerAutoAssign(returnDoc._id);
    }, 5000);

    res.status(200).json({
      success: true,
      message: "Return approved successfully. Auto-assign 5 second me trigger hoga.",
      return: returnDoc,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ❌ SELLER/ADMIN — Reject Return
// ============================================================
export const rejectReturn = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }

    const isSeller = returnDoc.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (returnDoc.status !== "REQUESTED") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject return at status: ${returnDoc.status}`,
      });
    }

    returnDoc.status = "REJECTED";
    returnDoc.rejectedAt = new Date();
    returnDoc.rejectionReason = rejectionReason || "No reason provided";
    await returnDoc.save();

    await Order.findByIdAndUpdate(returnDoc.order, {
      returnStatus: "REJECTED",
    });

    console.log(`❌ Return rejected: ${returnDoc._id}`);

    try {
      await sendNotificationToUser(
        returnDoc.user.toString(),
        "❌ Return Rejected",
        `Aapka return reject ho gaya. Reason: ${rejectionReason || "No reason"}`,
        {
          returnId: returnDoc._id.toString(),
          type: "RETURN_REJECTED",
          link: `/returns/${returnDoc._id}`,
        }
      );

      emitToUser(returnDoc.user.toString(), "return:rejected", {
        returnId: returnDoc._id,
        message: `❌ Return rejected`,
      });
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Return rejected",
      return: returnDoc,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 🚚 ADMIN — Schedule Pickup (Manual)
// ============================================================
export const schedulePickup = async (req, res, next) => {
  try {
    const { pickupPartnerId } = req.body;
    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }

    if (returnDoc.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: `Cannot schedule pickup at status: ${returnDoc.status}`,
      });
    }

    if (pickupPartnerId) {
      const partner = await User.findById(pickupPartnerId);
      if (!partner || partner.role !== "DELIVERY_PARTNER") {
        return res.status(400).json({
          success: false,
          message: "Invalid pickup partner",
        });
      }
      returnDoc.pickupPartner = pickupPartnerId;
    }

    returnDoc.pickupOTP = generateOTP();
    returnDoc.status = "PICKUP_SCHEDULED";
    returnDoc.pickupScheduledAt = new Date();
    await returnDoc.save();

    await Order.findByIdAndUpdate(returnDoc.order, {
      returnStatus: "PICKUP_SCHEDULED",
    });

    console.log(`🚚 Pickup scheduled (manual): ${returnDoc._id}`);

    try {
      await sendNotificationToUser(
        returnDoc.user.toString(),
        "🚚 Return Pickup Scheduled",
        `Aapka return pickup schedule ho gaya. Pickup OTP: ${returnDoc.pickupOTP}`,
        {
          returnId: returnDoc._id.toString(),
          type: "RETURN_PICKUP_SCHEDULED",
          link: `/returns/${returnDoc._id}`,
        }
      );
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    if (returnDoc.pickupPartner) {
      try {
        await sendNotificationToUser(
          returnDoc.pickupPartner.toString(),
          "📦 New Return Pickup",
          `Aapko ek return pickup assign hua hai`,
          {
            returnId: returnDoc._id.toString(),
            type: "RETURN_PICKUP_ASSIGNED",
            link: `/delivery/returns`,
          }
        );
      } catch (notifErr) {
        console.error("Notification failed:", notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Pickup scheduled successfully",
      return: returnDoc,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 🚚 AUTO-ASSIGN PICKUP — Manual Trigger (Admin Fallback)
// ============================================================
export const autoAssignPickup = async (req, res, next) => {
  try {
    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }

    if (returnDoc.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: `Cannot auto-assign at status: ${returnDoc.status}`,
      });
    }

    await triggerAutoAssign(returnDoc._id);

    const updated = await Return.findById(returnDoc._id);

    res.status(200).json({
      success: true,
      message: `Auto-assign successful!`,
      return: updated,
    });
  } catch (error) {
    console.error("❌ Auto-assign error:", error.message);
    next(error);
  }
};

// ============================================================
// 🔐 Verify Pickup OTP
// ============================================================
export const verifyPickupOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }

    if (returnDoc.status !== "PICKUP_SCHEDULED") {
      return res.status(400).json({
        success: false,
        message: `Cannot verify OTP at status: ${returnDoc.status}`,
      });
    }

    if (returnDoc.pickupOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    returnDoc.pickupOTPVerified = true;
    returnDoc.pickedUpAt = new Date();
    returnDoc.status = "PICKED_UP";
    await returnDoc.save();

    await Order.findByIdAndUpdate(returnDoc.order, {
      returnStatus: "PICKED_UP",
    });

    console.log(`✅ Return OTP verified: ${returnDoc._id}`);

    try {
      await sendNotificationToUser(
        returnDoc.seller.toString(),
        "📦 Return Product Picked Up",
        `Return product pickup ho gaya hai`,
        {
          returnId: returnDoc._id.toString(),
          type: "RETURN_PICKED_UP",
          link: `/seller/returns`,
        }
      );
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: "OTP verified, product picked up",
      return: returnDoc,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 📥 SELLER — Mark Return Received
// ============================================================
export const markReturnReceived = async (req, res, next) => {
  try {
    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }

    const isSeller = returnDoc.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (returnDoc.status !== "PICKED_UP") {
      return res.status(400).json({
        success: false,
        message: `Cannot mark received at status: ${returnDoc.status}`,
      });
    }

    returnDoc.status = "RECEIVED";
    returnDoc.receivedAt = new Date();
    await returnDoc.save();

    await Order.findByIdAndUpdate(returnDoc.order, {
      returnStatus: "RECEIVED",
    });

    console.log(`✅ Return received: ${returnDoc._id}`);

    res.status(200).json({
      success: true,
      message: "Return received successfully",
      return: returnDoc,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 💸 SELLER/ADMIN — Process Refund
// ============================================================
export const processRefund = async (req, res, next) => {
  try {
    const returnDoc = await Return.findById(req.params.id).populate(
      "order",
      "orderNumber paymentMode paymentDetails"
    );

    if (!returnDoc) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }

    const isSeller = returnDoc.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (returnDoc.status !== "RECEIVED") {
      return res.status(400).json({
        success: false,
        message: `Cannot process refund at status: ${returnDoc.status}`,
      });
    }

    let refundResult = { success: false };

    if (
      returnDoc.refundMethod === "RAZORPAY" &&
      returnDoc.order.paymentDetails?.transactionId
    ) {
      refundResult = await initiateRefund(
        returnDoc.order.paymentDetails.transactionId,
        returnDoc.refundAmount
      );

      if (refundResult.success) {
        returnDoc.razorpayRefundId = refundResult.refund.id;
        returnDoc.razorpayPaymentId = returnDoc.order.paymentDetails.transactionId;
      }
    } else if (returnDoc.refundMethod === "COD_CASH") {
      refundResult = { success: true, message: "COD cash refund marked" };
    } else if (returnDoc.refundMethod === "WALLET") {
      await User.findByIdAndUpdate(returnDoc.user, {
        $inc: { "wallet.available": returnDoc.refundAmount },
      });
      refundResult = { success: true, message: "Wallet credited" };
    }

    if (!refundResult.success) {
      return res.status(500).json({
        success: false,
        message: "Refund process failed",
        error: refundResult.message,
      });
    }

    returnDoc.status = "COMPLETED";
    returnDoc.refundInitiatedAt = new Date();
    returnDoc.completedAt = new Date();
    await returnDoc.save();

    await Order.findByIdAndUpdate(returnDoc.order._id, {
      returnStatus: "COMPLETED",
      "returnInfo.completedAt": new Date(),
    });

    console.log(`💸 Refund processed: ${returnDoc._id}`);

    try {
      await sendNotificationToUser(
        returnDoc.user.toString(),
        "💸 Refund Processed",
        `Aapka ₹${returnDoc.refundAmount} ka refund process ho gaya hai`,
        {
          returnId: returnDoc._id.toString(),
          type: "REFUND_COMPLETED",
          link: `/returns/${returnDoc._id}`,
        }
      );

      emitToUser(returnDoc.user.toString(), "return:completed", {
        returnId: returnDoc._id,
        message: `💸 Refund processed!`,
      });
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      return: returnDoc,
      refund: refundResult,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 👑 ADMIN — Get All Returns
// ============================================================
export const getAllReturns = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status && status !== "ALL") {
      query.status = status;
    }

    const returns = await Return.find(query)
      .populate("order", "orderNumber totalAmount")
      .populate("user", "name email phone")
      .populate("seller", "name email phone")
      .sort({ createdAt: -1 });

    const totalRequested = await Return.countDocuments({ status: "REQUESTED" });
    const totalApproved = await Return.countDocuments({ status: "APPROVED" });
    const totalCompleted = await Return.countDocuments({ status: "COMPLETED" });
    const totalRejected = await Return.countDocuments({ status: "REJECTED" });

    res.status(200).json({
      success: true,
      count: returns.length,
      returns,
      stats: {
        totalRequested,
        totalApproved,
        totalCompleted,
        totalRejected,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 📋 GET RETURN REASONS BY ORDER (Category-based)
// ============================================================
export const getReturnReasons = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate(
      "items.product",
      "category name"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Order ki pehli item ki category nikalo
    const firstItem = order.items?.[0];
    const category = firstItem?.product?.category || "";

    console.log(`📋 Return reasons requested for order ${order.orderNumber} (category: ${category})`);

    const { getReasonsByCategory } = await import(
      "../utils/returnReasons.js"
    );

    const reasons = getReasonsByCategory(category);

    res.status(200).json({
      success: true,
      category,
      reasons,
    });
  } catch (error) {
    next(error);
  }
};