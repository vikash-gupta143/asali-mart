import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    // 🔗 Order & User Reference
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    item: {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      name: String,
      image: String,
      qty: Number,
      finalPrice: Number,
    },

    // 📝 Return Reason
    reason: {
      type: String,
      enum: [
        "SIZE_ISSUE",
        "DAMAGED",
        "WRONG_PRODUCT",
        "QUALITY_ISSUE",
        "NOT_AS_DESCRIBED",
        "OTHER",
      ],
      required: true,
    },
    reasonText: { type: String, default: "" },

    // 📸 Photos
    images: {
      type: [String],
      default: [],
    },

    // 💰 Refund ya Exchange
    type: {
      type: String,
      enum: ["REFUND", "EXCHANGE"],
      default: "REFUND",
    },

    // 💵 Refund Amount (calculated)
    refundAmount: { type: Number, default: 0 },
    refundMethod: {
      type: String,
      enum: ["RAZORPAY", "WALLET", "COD_CASH"],
      default: "RAZORPAY",
    },

    // 📊 Status Flow
    status: {
      type: String,
      enum: [
        "REQUESTED",       // Customer ne request daali
        "APPROVED",        // Seller/Admin ne approve kiya
        "REJECTED",        // Reject kiya
        "PICKUP_SCHEDULED",// Delivery boy assign hua
        "PICKED_UP",       // Product pick up ho gaya
        "RECEIVED",        // Seller ko mil gaya
        "REFUND_INITIATED",// Refund process shuru
        "COMPLETED",       // Pura ho gaya
        "DISPUTED",        // Seller ne dispute raise kiya
      ],
      default: "REQUESTED",
    },

    // ⏱️ Timestamps for each step
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    rejectedAt: Date,
    pickupScheduledAt: Date,
    pickedUpAt: Date,
    receivedAt: Date,
    refundInitiatedAt: Date,
    completedAt: Date,

    // 🚫 Rejection
    rejectionReason: { type: String, default: "" },

    // 🚚 Return Pickup
    pickupPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pickupOTP: { type: String, default: null },
    pickupOTPVerified: { type: Boolean, default: false },

    // 💸 Razorpay Refund Info
    razorpayRefundId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    refundCompletedAt: Date,

    // 📝 Admin Notes
    adminNotes: { type: String, default: "" },

    // 🎯 Return window (2-3 hours)
    returnDeadline: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-generate return number
returnSchema.pre("save", async function () {
  if (!this.returnNumber) {
    const count = await mongoose.model("Return").countDocuments();
    this.returnNumber = `RET${1000 + count + 1}`;
  }
});

const Return = mongoose.model("Return", returnSchema);
export default Return;