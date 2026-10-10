import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import Payout from "../models/Payout.js";

// @desc    Get delivery partner wallet
// @route   GET /api/delivery/wallet
// @access  Private (DELIVERY_PARTNER)
export const getDeliveryWallet = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found",
      });
    }

    // Recent transactions (last 20)
    const transactions = (partner.transactions || [])
      .slice()
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 20);

    // Recent payouts
    const payouts = await Payout.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      wallet: {
        balance: partner.walletBalance || 0,
        cashInHand: partner.cashInHand || 0,
        platformDues: partner.platformDues || 0,
        totalEarned: partner.totalEarnings || 0,
        totalWithdrawn: partner.totalWithdrawn || 0,
        totalDeliveries: partner.totalDeliveries || 0,
      },
      bankDetails: partner.bankAccount || {},
      upiDetails: partner.upiDetails || {},
      transactions,
      payouts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery partner bank/UPI
// @route   PUT /api/delivery/bank
// @access  Private (DELIVERY_PARTNER)
export const updateDeliveryBank = async (req, res, next) => {
  try {
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      upiId,
      qrCodeUrl,
    } = req.body;

    const partner = await DeliveryPartner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    let updated = false;

    // Bank
    if (accountHolderName && accountNumber && ifscCode) {
      partner.bankAccount = {
        accountHolderName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName: bankName || "",
        isVerified: false,
      };
      updated = true;
    }

    // UPI
    if (upiId && upiId.includes("@")) {
      partner.upiDetails = {
        upiId: upiId.toLowerCase().trim(),
        qrCodeUrl: qrCodeUrl || partner.upiDetails?.qrCodeUrl || "",
        isVerified: false,
      };
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Bank ya UPI details me se koi ek zaroori hai",
      });
    }

    await partner.save();

    res.json({
      success: true,
      message: "Details updated. Admin will verify.",
      bankDetails: partner.bankAccount,
      upiDetails: partner.upiDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request payout (delivery partner)
// @route   POST /api/delivery/withdraw
// @access  Private (DELIVERY_PARTNER)
export const requestDeliveryPayout = async (req, res, next) => {
  try {
    const { amount, method = "BANK" } = req.body;

    if (!amount || amount < 500) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdraw ₹500",
      });
    }

    const partner = await DeliveryPartner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    // Validate method
    if (method === "UPI") {
      if (!partner.upiDetails?.upiId || !partner.upiDetails?.isVerified) {
        return res.status(400).json({
          success: false,
          message: "UPI verify nahi hua",
        });
      }
    } else {
      if (!partner.bankAccount?.accountNumber || !partner.bankAccount?.isVerified) {
        return res.status(400).json({
          success: false,
          message: "Bank verify nahi hua",
        });
      }
    }

    if ((partner.walletBalance || 0) < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${partner.walletBalance || 0}`,
      });
    }

    // Check pending payout
    const existing = await Payout.findOne({
      seller: req.user._id,
      status: { $in: ["PENDING", "APPROVED", "PROCESSING"] },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Pehle se ek pending payout hai",
      });
    }

    // Create payout
    const payoutData = {
      seller: req.user._id,
      amount,
      method,
      status: "PENDING",
    };

    if (method === "UPI") {
      payoutData.upiDetails = {
        upiId: partner.upiDetails.upiId,
        qrCodeUrl: partner.upiDetails.qrCodeUrl || "",
      };
    } else {
      payoutData.bankDetails = {
        accountHolderName: partner.bankAccount.accountHolderName,
        accountNumber: partner.bankAccount.accountNumber,
        ifscCode: partner.bankAccount.ifscCode,
        bankName: partner.bankAccount.bankName,
      };
    }

    const payout = await Payout.create(payoutData);

    // Deduct from wallet
    partner.walletBalance -= amount;
    if (!partner.transactions) partner.transactions = [];
    partner.transactions.push({
      type: "PAYOUT",
      amount: -amount,
      description: `Payout request (${method})`,
      status: "PENDING",
      at: new Date(),
    });
    await partner.save();

    res.status(201).json({
      success: true,
      message: "Payout request submitted!",
      payout,
      wallet: {
        balance: partner.walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Settle cash (admin marks delivery boy's cash as settled)
// @route   PUT /api/delivery/settle-cash
// @access  Private (DELIVERY_PARTNER) — for self, or Admin
export const settleCash = async (req, res, next) => {
  try {
    const { amount, method = "UPI", reference } = req.body;

    const partner = await DeliveryPartner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    if (amount > (partner.cashInHand || 0)) {
      return res.status(400).json({
        success: false,
        message: `Cash in hand se zyada nahi. Available: ₹${partner.cashInHand}`,
      });
    }

    partner.cashInHand -= amount;
    partner.platformDues -= amount;

    if (!partner.cashSettlements) partner.cashSettlements = [];
    partner.cashSettlements.push({
      amount,
      method,
      reference: reference || "",
      settledBy: req.user._id,
      at: new Date(),
    });

    await partner.save();

    res.json({
      success: true,
      message: "Cash settled",
      cashInHand: partner.cashInHand,
      platformDues: partner.platformDues,
    });
  } catch (error) {
    next(error);
  }
};