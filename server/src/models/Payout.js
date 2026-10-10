import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 500, // Minimum ₹500
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "PROCESSING", "PAID", "REJECTED"],
      default: "PENDING",
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String,
    },
    referenceId: { type: String, default: "" },
    transactionId: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    paidAt: Date,
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

payoutSchema.index({ seller: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });

const Payout = mongoose.model("Payout", payoutSchema);
export default Payout;