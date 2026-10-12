import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: String,
  image: String,
  price: Number,
  discount: Number,
  finalPrice: Number,
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  shopName: String,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    // ——— Delivery Address ———
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    // ——— Pickup Address (Seller ki shop) ———
    pickupAddress: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    // ——— Pricing ———
    itemsPrice: { type: Number, required: true, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    platformFee: { type: Number, default: 10 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    totalAmount: { type: Number, required: true, default: 0 },

    // ——— Business / Commission ———
    commissionRate: { type: Number, default: 5 },
    commissionAmount: { type: Number, default: 0 },
    sellerEarning: { type: Number, default: 0 },
    deliveryEarning: { type: Number, default: 0 },
    platformRevenue: { type: Number, default: 0 },

    // ——— Payment ———
    paymentMode: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    // 🆕 ——— Payment Details (Online UPI + Razorpay) ———
    paymentDetails: {
      method: {
        type: String,
        enum: ["COD", "ONLINE", "UPI"],
        default: "COD",
      },
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED", "VERIFIED", "REJECTED"],
        default: "PENDING",
      },
      paidAt: Date,
      transactionId: { type: String, default: "" },
      paidTo: { type: String, default: "" },
      screenshot: { type: String, default: "" },
      // 🆕 Razorpay fields
      razorpayOrderId: { type: String, default: "" },   // 👈 YEH ADD KIYA
      razorpayPaymentId: { type: String, default: "" }, // 👈 YEH BHI
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedAt: Date,
      rejectionReason: { type: String, default: "" },
      // 🆕 Refund fields
      refundId: { type: String, default: "" },
      refundedAt: Date,
      refundStatus: { type: String, default: "" },
    },

    // 🆕 ——— Payment Collection (Delivery Boy ne cash/UPI liya) ———
    paymentCollection: {
      method: {
        type: String,
        enum: ["CASH", "UPI", "ONLINE", "PENDING"],
        default: "PENDING",
      },
      collectedAt: Date,
      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      amount: { type: Number, default: 0 },
      cashSettled: { type: Boolean, default: false },
      cashSettledAt: Date,
      cashSettlementRef: { type: String, default: "" },
    },

    // ——— Order Status ———
    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
    },

    // ——— Delivery System ———
    deliveryType: {
      type: String,
      enum: ["SELLER", "ASALIMART", "THIRD_PARTY"],
      default: "SELLER",
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deliveryOTP: {
      type: String,
      default: null,
    },
    deliveryOTPVerified: {
      type: Boolean,
      default: false,
    },
    deliveryEarnings: {
      type: Number,
      default: 0,
    },
    deliveryNotes: {
      type: String,
      default: "",
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },

    // ——— Distance / Time ———
    distance: { type: Number, default: 0 },
    timeWindow: { type: String, default: "" },
    maxRadiusAtOrder: { type: Number, default: 0 },

    // ——— Status History ———
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
      },
    ],

    // ——— Timestamps ———
       // ——— Timestamps ———
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,

    // 🆕 ——— Return/Refund System ———
    returnStatus: {
      type: String,
      enum: [
        "NONE",
        "REQUESTED",
        "APPROVED",
        "REJECTED",
        "PICKUP_SCHEDULED",
        "PICKED_UP",
        "RECEIVED",
        "REFUND_INITIATED",
        "COMPLETED",
        "DISPUTED",
      ],
      default: "NONE",
    },

    // 🆕 ——— Return Window Deadline ———
    returnDeadline: {
      type: Date,
      default: null,
    },

    // 🆕 ——— Return Info (Aggregate) ———
    returnInfo: {
      returnId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Return",
        default: null,
      },
      reason: { type: String, default: "" },
      type: {
        type: String,
        enum: ["REFUND", "EXCHANGE", ""],
        default: "",
      },
      refundAmount: { type: Number, default: 0 },
      refundMethod: { type: String, default: "" },
      requestedAt: Date,
      completedAt: Date,
    },
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `AM${1000 + count + 1}`;
  }
  if (this.isModified("orderStatus")) {
    this.statusHistory.push({ status: this.orderStatus });
  }
});

const Order = mongoose.model("Order", orderSchema);
export default Order;