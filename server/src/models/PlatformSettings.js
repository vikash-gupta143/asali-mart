import mongoose from "mongoose";

const platformSettingsSchema = new mongoose.Schema(
  {
    // 🏦 Admin ka UPI
    platformUpiId: {
      type: String,
      default: "",
    },
    platformQrCode: {
      type: String,
      default: "",
    },
    platformName: {
      type: String,
      default: "AsaliMart",
    },
    // 📞 Support
    supportEmail: {
      type: String,
      default: "support@asalimart.com",
    },
    supportPhone: {
      type: String,
      default: "",
    },
    // 💰 Rates
    commissionRate: {
      type: Number,
      default: 5, // Seller commission %
    },
    deliveryCommissionRate: {
      type: Number,
      default: 20, // Delivery partner commission %
    },
    minPayout: {
      type: Number,
      default: 500,
    },
    payoutCycle: {
      type: String,
      default: "T+7",
    },
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);
export default PlatformSettings;