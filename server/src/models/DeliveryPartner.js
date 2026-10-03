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

    // Bank Details
    bankAccount: {
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true, uppercase: true },
      accountHolderName: { type: String, required: true },
      bankName: String,
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

    // Stats
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },

    // Availability
    isAvailable: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },

    // 🌍 Live Location (GeoJSON)
    // Default: [0, 0] — partner online hone pe update hoga
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],   // [longitude, latitude]
      },
    },
  },
  { timestamps: true }
);

// 🌍 Geo index — nearby delivery partners ke liye
deliveryPartnerSchema.index({ currentLocation: "2dsphere" });

const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
export default DeliveryPartner;