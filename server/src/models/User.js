import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["CUSTOMER", "SELLER", "ADMIN", "DELIVERY_PARTNER"],
      default: "CUSTOMER",
    },

    // ============================================
    // 💰 SELLER WALLET
    // ============================================
    wallet: {
      available: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
      totalWithdrawn: { type: Number, default: 0 },
    },

    // ============================================
    // 🏦 BANK DETAILS
    // ============================================
    bankDetails: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "", uppercase: true },
      bankName: { type: String, default: "" },
      branchName: { type: String, default: "" },
      isVerified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rejectionReason: { type: String, default: "" },
      rejectedAt: Date,
    },

    // ============================================
    // 📱 UPI DETAILS
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

    avatar: {
      type: String,
      default: "",
    },
    addresses: [
      {
        name: String,
        phone: String,
        line1: String,
        city: String,
        pincode: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },

    // ============================================
    // 🔔 FCM TOKEN (Push Notifications ke liye)
    // ============================================
    fcmToken: {
      type: String,
      default: "",
    },

    // ============================================
    // 🔐 PASSWORD RESET (Forget Password)
    // ============================================
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ============================================
// 🔐 Password hash karne se pehle
// ============================================
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ============================================
// 🔐 Password compare method
// ============================================
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ============================================
// 🔐 Generate Password Reset Token
// ============================================
userSchema.methods.getResetPasswordToken = function () {
  // Random 32-byte token generate karein
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Token ko hash karke DB me save karein
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 15 minute ka expiry
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  // Plain token return karein (email me bhejne ke liye)
  return resetToken;
};

const User = mongoose.model("User", userSchema);
export default User;