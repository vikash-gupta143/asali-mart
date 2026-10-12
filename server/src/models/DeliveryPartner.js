import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Personal Info
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },

    // KYC Documents
    aadhaarNumber: { type: String, required: true, unique: true },
    panNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    aadhaarFront: { type: String, required: true },
    aadhaarBack: { type: String, required: true },
    panCard: { type: String, required: true },
    selfie: { type: String, required: true },

    // ============================================
    // 🏦 BANK DETAILS (UPDATED)
    // ============================================
    bankAccount: {
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "", uppercase: true },
      accountHolderName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      // Verification fields
      isVerified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rejectionReason: { type: String, default: "" },
      rejectedAt: Date,
    },

    // ============================================
    // 📱 UPI DETAILS (NEW)
    // ============================================
    upiDetails: {
      upiId: { type: String, default: "" },
      qrCodeUrl: { type: String, default: "" },
      isVerified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rejectionReason: { type: String, default: "" },
      rejectedAt: Date,
    },

    // Vehicle Info
    vehicle: {
      type: {
        type: String,
        enum: ["BIKE", "SCOOTER", "CYCLE", "CAR", "WALK"],
        default: "BIKE",
      },
      number: String,
      model: String,
      rcDocument: String,
    },

    // Address
    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },

    // Verification
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "PENDING",
    },
    rejectionReason: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,

    // ⭐ Rating System
rating: {
  type: Number,
  default: 0,
  min: 0,
  max: 5,
},
totalRatings: {
  type: Number,
  default: 0,
},
ratingBreakdown: {
  5: { type: Number, default: 0 },
  4: { type: Number, default: 0 },
  3: { type: Number, default: 0 },
  2: { type: Number, default: 0 },
  1: { type: Number, default: 0 },
},

// 🎯 Performance Metrics
totalDeliveries: {
  type: Number,
  default: 0,
},
totalReturns: {
  type: Number,
  default: 0,
},

    // Stats
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },

    // ============================================
    // 💰 WALLET & EARNINGS
    // ============================================
    walletBalance: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    cashInHand: {
      type: Number,
      default: 0,
    },
    platformDues: {
      type: Number,
      default: 0,
    },

    // Transaction History
    transactions: [
      {
        type: {
          type: String,
          enum: [
            "DELIVERY_EARNING",
            "CASH_COLLECTED",
            "PLATFORM_DUES",
            "CASH_SETTLED",
            "PAYOUT",
            "BONUS",
            "PENALTY",
            "ADJUSTMENT",
          ],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        orderNumber: String,
        description: String,
        status: {
          type: String,
          enum: ["PENDING", "COMPLETED", "FAILED"],
          default: "COMPLETED",
        },
        at: { type: Date, default: Date.now },
      },
    ],

    // Cash Settlements (COD)
    cashSettlements: [
      {
        amount: { type: Number, required: true },
        method: {
          type: String,
          enum: ["CASH", "UPI", "BANK_TRANSFER"],
          default: "CASH",
        },
        reference: String,
        settledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        at: { type: Date, default: Date.now },
      },
    ],

    // Availability
    isAvailable: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },

    // 🌍 Live Location (GeoJSON)
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  { timestamps: true }
);

// 🌍 Geo index
deliveryPartnerSchema.index({ currentLocation: "2dsphere" });

const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
export default DeliveryPartner;