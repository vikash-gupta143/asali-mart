import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "General",
    },

    // ——— Contact ———
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: "",
    },

    // ——— Address ———
    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },

    // ——— Location (GeoJSON) ———
    location: {
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

    // ——— 📋 KYC / Legal Documents ———
    legal: {
      gstNumber: { type: String, default: "" },
      panNumber: { type: String, default: "" },
      aadhaarNumber: { type: String, default: "" },
      shopLicenseNumber: { type: String, default: "" },
      registrationNumber: { type: String, default: "" },
      fssaiNumber: { type: String, default: "" }, // Food shops ke liye
    },

    // ——— 📸 Document Uploads (Cloudinary) ———
    documents: {
      gstCertificate: { type: String, default: "" },
      panCard: { type: String, default: "" },
      aadhaarCard: { type: String, default: "" },
      shopLicense: { type: String, default: "" },
      shopFrontPhoto: { type: String, default: "" },
      insideShopPhoto: { type: String, default: "" },
      ownerPhoto: { type: String, default: "" },
      bankCheque: { type: String, default: "" },
    },

    // ——— 🏦 Bank Details ———
    bank: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      branchName: { type: String, default: "" },
    },

    // ——— 🏪 Shop Details ———
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    openingTime: { type: String, default: "" },
    closingTime: { type: String, default: "" },
    workingDays: { type: [String], default: [] },

    // ——— 🛡️ Approval Status ———
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "PENDING",
    },
    rejectionReason: { type: String, default: "" },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    verified: { type: Boolean, default: false },

    // ——— 📊 Stats ———
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },

    // ——— ⚙️ Settings ———
    isActive: { type: Boolean, default: true },
    deliveryRadius: { type: Number, default: 5 }, // km
    minOrderValue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Geo index
shopSchema.index({ location: "2dsphere" });

// Index for filtering
shopSchema.index({ status: 1, isActive: 1 });

const Shop = mongoose.model("Shop", shopSchema);
export default Shop;