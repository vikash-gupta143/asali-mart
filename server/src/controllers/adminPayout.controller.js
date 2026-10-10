import Payout from "../models/Payout.js";
import User from "../models/User.js";

// @desc    Get all payouts (Admin)
// @route   GET /api/admin/payouts
// @access  Private (ADMIN)
export const getAllPayouts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== "ALL") query.status = status;

    const payouts = await Payout.find(query)
      .populate("seller", "name email phone")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

    // Stats
    const stats = {
      totalPending: await Payout.countDocuments({ status: "PENDING" }),
      totalApproved: await Payout.countDocuments({ status: "APPROVED" }),
      totalPaid: await Payout.countDocuments({ status: "PAID" }),
      pendingAmount: await Payout.aggregate([
        { $match: { status: "PENDING" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      approvedAmount: await Payout.aggregate([
        { $match: { status: "APPROVED" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      paidAmount: await Payout.aggregate([
        { $match: { status: "PAID" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    };

    res.json({
      success: true,
      count: payouts.length,
      payouts,
      stats: {
        totalPending: stats.totalPending,
        totalApproved: stats.totalApproved,
        totalPaid: stats.totalPaid,
        pendingAmount: stats.pendingAmount[0]?.total || 0,
        approvedAmount: stats.approvedAmount[0]?.total || 0,
        paidAmount: stats.paidAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve payout
// @route   PUT /api/admin/payouts/:id/approve
// @access  Private (ADMIN)
export const approvePayout = async (req, res, next) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    if (payout.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve. Status: ${payout.status}`,
      });
    }

    payout.status = "APPROVED";
    payout.approvedBy = req.user._id;
    payout.approvedAt = new Date();
    payout.notes = req.body.notes || "Approved by admin";
    await payout.save();

    res.json({ success: true, message: "Payout approved", payout });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject payout
// @route   PUT /api/admin/payouts/:id/reject
// @access  Private (ADMIN)
export const rejectPayout = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    if (!["PENDING", "APPROVED"].includes(payout.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reject. Status: ${payout.status}`,
      });
    }

    payout.status = "REJECTED";
    payout.rejectionReason = reason || "Rejected by admin";
    await payout.save();

    // Return money to seller's available balance
    await User.findByIdAndUpdate(payout.seller, {
      $inc: {
        "wallet.available": payout.amount,
        "wallet.pending": -payout.amount,
      },
    });

    res.json({ success: true, message: "Payout rejected", payout });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark payout as paid
// @route   PUT /api/admin/payouts/:id/paid
// @access  Private (ADMIN)
export const markPayoutPaid = async (req, res, next) => {
  try {
    const { referenceId, transactionId, notes } = req.body;
    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, message: "Payout not found" });
    }

    if (payout.status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: `Only approved payouts can be marked paid. Status: ${payout.status}`,
      });
    }

    payout.status = "PAID";
    payout.paidAt = new Date();
    payout.referenceId = referenceId || "";
    payout.transactionId = transactionId || "";
    payout.notes = notes || "Payment completed";
    await payout.save();

    // Update seller wallet
    await User.findByIdAndUpdate(payout.seller, {
      $inc: {
        "wallet.pending": -payout.amount,
        "wallet.totalWithdrawn": payout.amount,
      },
    });

    res.json({ success: true, message: "Payout marked as paid", payout });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify seller bank details
// @route   PUT /api/admin/sellers/:sellerId/verify-bank
// @access  Private (ADMIN)
export const verifySellerBank = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.sellerId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.bankDetails.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: "Bank verified",
      bankDetails: user.bankDetails,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// 🏦 BANK + UPI VERIFICATION (SELLER)
// ============================================

// @desc    Get all sellers with bank/UPI details
// @route   GET /api/admin/bank-verifications
// @access  Private (ADMIN)
export const getBankVerifications = async (req, res, next) => {
  try {
    const { status } = req.query;

    // 🆕 Sellers with bank OR UPI details
    let query = {
      role: "SELLER",
      $or: [
        { "bankDetails.accountNumber": { $ne: "" } },
        { "upiDetails.upiId": { $ne: "" } },
      ],
    };

    if (status === "VERIFIED") {
      query["bankDetails.isVerified"] = true;
      query["upiDetails.isVerified"] = true;
    } else if (status === "PENDING") {
      query.$and = [
        {
          $or: [
            { "bankDetails.isVerified": false, "bankDetails.accountNumber": { $ne: "" } },
            { "upiDetails.isVerified": false, "upiDetails.upiId": { $ne: "" } },
          ],
        },
      ];
    }

    // 🆕 upiDetails bhi select karein
    const sellers = await User.find(query)
      .select("name email phone bankDetails upiDetails wallet createdAt")
      .sort({ "bankDetails.isVerified": 1, createdAt: -1 });

    // Stats
    const totalPending = await User.countDocuments({
      role: "SELLER",
      $or: [
        { "bankDetails.accountNumber": { $ne: "" }, "bankDetails.isVerified": false },
        { "upiDetails.upiId": { $ne: "" }, "upiDetails.isVerified": false },
      ],
    });

    const totalVerified = await User.countDocuments({
      role: "SELLER",
      "bankDetails.isVerified": true,
      "upiDetails.isVerified": true,
    });

    res.json({
      success: true,
      count: sellers.length,
      sellers,
      stats: {
        totalPending,
        totalVerified,
        total: sellers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify seller bank + UPI
// @route   PUT /api/admin/bank-verifications/:sellerId/verify
// @access  Private (ADMIN)
export const verifySellerBankDetails = async (req, res, next) => {
  try {
    const seller = await User.findById(req.params.sellerId);

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    // 🏦 Verify Bank (if exists)
    if (seller.bankDetails?.accountNumber) {
      seller.bankDetails.isVerified = true;
      seller.bankDetails.verifiedAt = new Date();
      seller.bankDetails.verifiedBy = req.user._id;
    }

    // 📱 Verify UPI (if exists)
    if (seller.upiDetails?.upiId) {
      seller.upiDetails.isVerified = true;
      seller.upiDetails.verifiedAt = new Date();
      seller.upiDetails.verifiedBy = req.user._id;
    }

    if (!seller.bankDetails?.accountNumber && !seller.upiDetails?.upiId) {
      return res.status(400).json({
        success: false,
        message: "Seller has no bank or UPI details",
      });
    }

    await seller.save();

    res.json({
      success: true,
      message: "Bank & UPI verified successfully",
      seller: {
        _id: seller._id,
        name: seller.name,
        bankDetails: seller.bankDetails,
        upiDetails: seller.upiDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject seller bank + UPI
// @route   PUT /api/admin/bank-verifications/:sellerId/reject
// @access  Private (ADMIN)
export const rejectSellerBankDetails = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const seller = await User.findById(req.params.sellerId);

    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    // 🏦 Clear Bank
    if (seller.bankDetails?.accountNumber) {
      seller.bankDetails = {
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        branchName: "",
        isVerified: false,
        rejectionReason: reason || "Invalid bank details",
        rejectedAt: new Date(),
      };
    }

    // 📱 Clear UPI
    if (seller.upiDetails?.upiId) {
      seller.upiDetails = {
        upiId: "",
        qrCodeUrl: "",
        isVerified: false,
        rejectionReason: reason || "Invalid UPI details",
        rejectedAt: new Date(),
      };
    }

    await seller.save();

    res.json({
      success: true,
      message: "Bank & UPI rejected. Seller will need to re-add.",
      seller,
    });
  } catch (error) {
    next(error);
  }
};