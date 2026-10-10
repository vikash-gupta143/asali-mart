import User from "../models/User.js";
import Payout from "../models/Payout.js";
import Order from "../models/Order.js";

// @desc    Get seller wallet
// @route   GET /api/seller/wallet
// @access  Private (SELLER)
export const getSellerWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "wallet bankDetails upiDetails" // 🆕 upiDetails add
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Recent payouts
    const recentPayouts = await Payout.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      wallet: user.wallet || {
        available: 0,
        pending: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      },
      bankDetails: user.bankDetails || {},
      upiDetails: user.upiDetails || {}, // 🆕
      recentPayouts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update seller bank details + UPI
// @route   PUT /api/seller/bank
// @access  Private (SELLER)
export const updateBankDetails = async (req, res, next) => {
  try {
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      upiId,        // 🆕
      qrCodeUrl,    // 🆕
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let updated = false;

    // 🏦 Update Bank (if provided)
    if (accountHolderName && accountNumber && ifscCode) {
      user.bankDetails = {
        accountHolderName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName: bankName || "",
        branchName: branchName || "",
        isVerified: false,
      };
      updated = true;
    }

    // 📱 Update UPI (if provided)
    if (upiId && upiId.includes("@")) {
      user.upiDetails = {
        upiId: upiId.toLowerCase().trim(),
        qrCodeUrl: qrCodeUrl || user.upiDetails?.qrCodeUrl || "",
        isVerified: false,
      };
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Bank details ya UPI ID me se koi ek zaroori hai",
      });
    }

    await user.save();

    res.json({
      success: true,
      message: "Details updated. Admin will verify.",
      bankDetails: user.bankDetails,
      upiDetails: user.upiDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request withdraw
// @route   POST /api/seller/withdraw
// @access  Private (SELLER)
export const requestWithdraw = async (req, res, next) => {
  try {
    const { amount, method = "BANK" } = req.body; // 🆕 method

    if (!amount || amount < 500) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdraw amount is ₹500",
      });
    }

    const user = await User.findById(req.user._id);

    // 🆕 Validate based on method
    if (method === "UPI") {
      if (!user.upiDetails?.upiId) {
        return res.status(400).json({
          success: false,
          message: "Please add UPI details first",
        });
      }
      if (!user.upiDetails?.isVerified) {
        return res.status(400).json({
          success: false,
          message: "UPI verification pending. Wait for admin approval.",
        });
      }
    } else {
      if (!user.bankDetails?.accountNumber) {
        return res.status(400).json({
          success: false,
          message: "Please add bank details first",
        });
      }
      if (!user.bankDetails?.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Bank verification pending. Wait for admin approval.",
        });
      }
    }

    if (user.wallet.available < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${user.wallet.available}`,
      });
    }

    // Check if pending payout already exists
    const existingPending = await Payout.findOne({
      seller: req.user._id,
      status: { $in: ["PENDING", "APPROVED", "PROCESSING"] },
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending payout request",
      });
    }

    // 🆕 Build payout data based on method
    const payoutData = {
      seller: req.user._id,
      amount,
      method,
      status: "PENDING",
    };

    if (method === "UPI") {
      payoutData.upiDetails = {
        upiId: user.upiDetails.upiId,
        qrCodeUrl: user.upiDetails.qrCodeUrl || "",
      };
    } else {
      payoutData.bankDetails = {
        accountHolderName: user.bankDetails.accountHolderName,
        accountNumber: user.bankDetails.accountNumber,
        ifscCode: user.bankDetails.ifscCode,
        bankName: user.bankDetails.bankName,
        branchName: user.bankDetails.branchName,
      };
    }

    const payout = await Payout.create(payoutData);

    // Move from available to pending
    user.wallet.available -= amount;
    user.wallet.pending += amount;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Withdraw request submitted. Admin will process in 2-3 working days.",
      payout,
      wallet: user.wallet,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my payouts
// @route   GET /api/seller/payouts
// @access  Private (SELLER)
export const getMyPayouts = async (req, res, next) => {
  try {
    const payouts = await Payout.find({ seller: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payouts.length, payouts });
  } catch (error) {
    next(error);
  }
};

// @desc    Update wallet on order delivered
// Called from order controller
export const creditSellerWallet = async (sellerId, earning, orderId) => {
  try {
    await User.findByIdAndUpdate(sellerId, {
      $inc: {
        "wallet.available": earning,
        "wallet.totalEarned": earning,
      },
    });
    console.log(`💰 Seller ${sellerId} credited ₹${earning} for order ${orderId}`);
  } catch (error) {
    console.error("Wallet credit error:", error.message);
  }
};