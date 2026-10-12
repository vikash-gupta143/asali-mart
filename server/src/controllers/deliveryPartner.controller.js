import DeliveryPartner from "../models/DeliveryPartner.js";
import User from "../models/User.js";

// 🔔 FCM Push Notification Helper
import { sendNotificationToUser } from "../utils/sendNotification.js";

// @desc    Register as delivery partner with KYC
// @route   POST /api/delivery-partners/register
// @access  Private
export const registerDeliveryPartner = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check if already registered
    const existing = await DeliveryPartner.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already registered as delivery partner",
      });
    }

    // Check required files
    if (
      !req.files?.aadhaarFront ||
      !req.files?.aadhaarBack ||
      !req.files?.panCard ||
      !req.files?.selfie
    ) {
      return res.status(400).json({
        success: false,
        message: "All documents required: Aadhaar front/back, PAN, Selfie",
      });
    }

    // 🆕 UPI validation (compulsory)
    if (!req.body.upiId || !req.body.upiId.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Valid UPI ID required (e.g. name@paytm)",
      });
    }

    // Check unique Aadhaar / PAN
    const existingAadhaar = await DeliveryPartner.findOne({
      aadhaarNumber: req.body.aadhaarNumber,
    });
    if (existingAadhaar) {
      return res.status(400).json({
        success: false,
        message: "This Aadhaar is already registered",
      });
    }

    const existingPan = await DeliveryPartner.findOne({
      panNumber: req.body.panNumber?.toUpperCase(),
    });
    if (existingPan) {
      return res.status(400).json({
        success: false,
        message: "This PAN is already registered",
      });
    }

    const partner = await DeliveryPartner.create({
      user: userId,
      fullName: req.body.fullName,
      phone: req.body.phone,
      email: req.body.email,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      aadhaarNumber: req.body.aadhaarNumber,
      panNumber: req.body.panNumber?.toUpperCase(),
      aadhaarFront: req.files.aadhaarFront[0].path,
      aadhaarBack: req.files.aadhaarBack[0].path,
      panCard: req.files.panCard[0].path,
      selfie: req.files.selfie[0].path,

      // 🏦 Bank Details
      bankAccount: {
        accountNumber: req.body.accountNumber,
        ifscCode: req.body.ifscCode?.toUpperCase(),
        accountHolderName: req.body.accountHolderName,
        bankName: req.body.bankName,
        isVerified: false,
      },

      // 🆕 UPI Details
      upiDetails: {
        upiId: req.body.upiId?.toLowerCase().trim() || "",
        qrCodeUrl: req.files?.upiQr?.[0]?.path || "",
        isVerified: false,
      },

      // 🚗 Vehicle
      vehicle: {
        type: req.body.vehicleType || "BIKE",
        number: req.body.vehicleNumber,
        model: req.body.vehicleModel,
        rcDocument: req.files?.rcDocument?.[0]?.path || null,
      },

      // 📍 Address
      address: {
        line1: req.body.line1,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
      },

      status: "PENDING",
    });

    // 🔔 PUSH NOTIFICATION (FCM) — Notify all ADMINS about new application
    try {
      const admins = await User.find({ role: "ADMIN" }).select("_id");
      for (const admin of admins) {
        await sendNotificationToUser(
          admin._id.toString(),
          "🚚 New Delivery Partner Application",
          `${partner.fullName} has applied to become a delivery partner`,
          {
            partnerId: partner._id.toString(),
            type: "NEW_DELIVERY_PARTNER_APPLICATION",
            link: "/admin/delivery-partners",
          }
        );
      }
    } catch (notifErr) {
      console.error("❌ Push notification failed:", notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Application submitted! Admin will verify in 24-48 hours.",
      partner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my application
// @route   GET /api/delivery-partners/me
// @access  Private
export const getMyApplication = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "No application found",
      });
    }
    res.json({ success: true, partner });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin — get all applications
// @route   GET /api/delivery-partners
// @access  Private (ADMIN)
export const getAllApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== "ALL") query.status = status;

    const partners = await DeliveryPartner.find(query)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: partners.length, partners });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin — approve/reject
// @route   PUT /api/delivery-partners/:id/verify
// @access  Private (ADMIN)
export const verifyApplication = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const partner = await DeliveryPartner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (action === "approve") {
      partner.status = "APPROVED";
      partner.approvedBy = req.user._id;
      partner.approvedAt = new Date();

      // Change user role
      await User.findByIdAndUpdate(partner.user, {
        role: "DELIVERY_PARTNER",
      });
    } else if (action === "reject") {
      partner.status = "REJECTED";
      partner.rejectionReason = reason || "Documents not valid";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    await partner.save();

    // 🔔 PUSH NOTIFICATION (FCM) — Notify partner about approval/rejection
    try {
      if (action === "approve") {
        await sendNotificationToUser(
          partner.user.toString(),
          "🎉 Application Approved!",
          `Congratulations! You are now an AsaliMart Delivery Partner.`,
          {
            partnerId: partner._id.toString(),
            type: "DELIVERY_PARTNER_APPROVED",
            link: "/delivery/dashboard",
          }
        );
      } else if (action === "reject") {
        await sendNotificationToUser(
          partner.user.toString(),
          "❌ Application Rejected",
          `Your application was rejected. Reason: ${reason || "Documents not valid"}`,
          {
            partnerId: partner._id.toString(),
            type: "DELIVERY_PARTNER_REJECTED",
            link: "/delivery/status",
          }
        );
      }
    } catch (notifErr) {
      console.error("❌ Push notification failed:", notifErr.message);
    }

    res.json({
      success: true,
      message: `Application ${action}d successfully`,
      partner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery partner live location
// @route   PUT /api/delivery-partners/location
// @access  Private (DELIVERY_PARTNER)
export const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, isAvailable } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const partner = await DeliveryPartner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner profile not found",
      });
    }

    if (partner.status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Your account is not approved yet",
      });
    }

    partner.currentLocation = {
      type: "Point",
      coordinates: [Number(lng), Number(lat)],
    };
    partner.lastActiveAt = new Date();
    if (typeof isAvailable === "boolean") {
      partner.isAvailable = isAvailable;
    }

    await partner.save();

    res.json({
      success: true,
      message: "Location updated",
      location: partner.currentLocation,
      isAvailable: partner.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle availability
// @route   PUT /api/delivery-partners/availability
// @access  Private (DELIVERY_PARTNER)
export const toggleAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    const partner = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    partner.isAvailable = !!isAvailable;
    partner.lastActiveAt = new Date();
    await partner.save();

    res.json({
      success: true,
      message: `You are ${partner.isAvailable ? "Online" : "Offline"}`,
      isAvailable: partner.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby available delivery partners
// @route   GET /api/delivery-partners/nearby?lat=..&lng=..&radius=5
// @access  Private (SELLER, ADMIN)
export const getNearbyPartners = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const partners = await DeliveryPartner.find({
      status: "APPROVED",
      isAvailable: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius) * 1000,
        },
      },
    })
      .populate("user", "name email phone")
      .limit(20);

    res.json({
      success: true,
      count: partners.length,
      partners,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// 🆕 ADMIN — DELIVERY PARTNER BANK & UPI VERIFICATION
// ============================================

// @desc    Get delivery partner bank verifications
// @route   GET /api/admin/delivery-bank-verifications
// @access  Private (ADMIN)
export const getDeliveryBankVerifications = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = {
      "bankAccount.accountNumber": { $ne: "" },
    };

    if (status === "VERIFIED") {
      query["bankAccount.isVerified"] = true;
    } else if (status === "PENDING") {
      query["bankAccount.isVerified"] = false;
    }

    const partners = await DeliveryPartner.find(query)
      .populate("user", "name email phone")
      .sort({ "bankAccount.isVerified": 1, createdAt: -1 });

    const totalPending = await DeliveryPartner.countDocuments({
      "bankAccount.accountNumber": { $ne: "" },
      "bankAccount.isVerified": false,
    });

    const totalVerified = await DeliveryPartner.countDocuments({
      "bankAccount.accountNumber": { $ne: "" },
      "bankAccount.isVerified": true,
    });

    // Map to include user info at top level
    const mappedPartners = partners.map((p) => ({
      _id: p._id,
      name: p.user?.name || p.fullName,
      fullName: p.fullName,
      email: p.user?.email || p.email,
      phone: p.user?.phone || p.phone,
      bankDetails: {
        accountNumber: p.bankAccount?.accountNumber,
        ifscCode: p.bankAccount?.ifscCode,
        accountHolderName: p.bankAccount?.accountHolderName,
        bankName: p.bankAccount?.bankName,
        isVerified: p.bankAccount?.isVerified,
      },
      upiDetails: p.upiDetails,
    }));

    res.json({
      success: true,
      count: mappedPartners.length,
      partners: mappedPartners,
      stats: {
        totalPending,
        totalVerified,
        total: totalPending + totalVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify delivery partner bank & UPI
// @route   PUT /api/admin/delivery-bank-verifications/:partnerId/verify
// @access  Private (ADMIN)
export const verifyDeliveryBank = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    if (partner.bankAccount) {
      partner.bankAccount.isVerified = true;
      partner.bankAccount.verifiedAt = new Date();
      partner.bankAccount.verifiedBy = req.user._id;
    }

    if (partner.upiDetails) {
      partner.upiDetails.isVerified = true;
      partner.upiDetails.verifiedAt = new Date();
      partner.upiDetails.verifiedBy = req.user._id;
    }

    await partner.save();

    // 🔔 PUSH NOTIFICATION (FCM) — Notify partner that bank is verified
    try {
      await sendNotificationToUser(
        partner.user.toString(),
        "🏦 Bank Details Verified",
        "Your bank & UPI details have been verified successfully.",
        {
          partnerId: partner._id.toString(),
          type: "BANK_VERIFIED",
          link: "/delivery/earnings",
        }
      );
    } catch (notifErr) {
      console.error("❌ Push notification failed:", notifErr.message);
    }

    res.json({
      success: true,
      message: "Bank & UPI verified",
      partner,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject delivery partner bank & UPI
// @route   PUT /api/admin/delivery-bank-verifications/:partnerId/reject
// @access  Private (ADMIN)
export const rejectDeliveryBank = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const partner = await DeliveryPartner.findById(req.params.partnerId);

    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    if (partner.bankAccount) {
      partner.bankAccount = {
        accountNumber: "",
        ifscCode: "",
        accountHolderName: "",
        bankName: "",
        isVerified: false,
        rejectionReason: reason || "Invalid bank details",
        rejectedAt: new Date(),
      };
    }

    if (partner.upiDetails) {
      partner.upiDetails = {
        upiId: "",
        qrCodeUrl: "",
        isVerified: false,
        rejectionReason: reason || "Invalid UPI details",
        rejectedAt: new Date(),
      };
    }

    await partner.save();

    // 🔔 PUSH NOTIFICATION (FCM) — Notify partner about bank rejection
    try {
      await sendNotificationToUser(
        partner.user.toString(),
        "❌ Bank Details Rejected",
        `Your bank details were rejected. Reason: ${reason || "Invalid bank details"}. Please re-upload.`,
        {
          partnerId: partner._id.toString(),
          type: "BANK_REJECTED",
          link: "/delivery/profile",
        }
      );
    } catch (notifErr) {
      console.error("❌ Push notification failed:", notifErr.message);
    }

    res.json({
      success: true,
      message: "Bank & UPI rejected. Partner will need to re-add.",
      partner,
    });
  } catch (error) {
    next(error);
  }
};