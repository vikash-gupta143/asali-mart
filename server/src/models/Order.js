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
    },

    // ——— Pricing ———
    itemsPrice: { type: Number, required: true, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },          // ← Coupon discount
    couponCode: { type: String, default: "" },       // ← Applied coupon
    totalAmount: { type: Number, required: true, default: 0 },

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

    // ——— Business / Commission ———  ← NAYA
    commissionRate: {
      type: Number,
      default: 5,          // 5% platform commission
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    sellerEarnings: {
      type: Number,
      default: 0,
    },

    // ——— Status History ———
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
      },
    ],

    // ——— Timestamps ———
    deliveredAt: Date,
    cancelledAt: Date,
    cancelReason: String,
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