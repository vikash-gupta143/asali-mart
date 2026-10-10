import PlatformSettings from "../models/PlatformSettings.js";

// @desc    Get platform settings (public — for checkout)
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }
    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update platform settings (admin)
// @route   PUT /api/settings
// @access  Private (ADMIN)
export const updateSettings = async (req, res, next) => {
  try {
    const {
      platformUpiId,
      platformQrCode,
      platformName,
      supportEmail,
      supportPhone,
      commissionRate,
      deliveryCommissionRate,
      minPayout,
    } = req.body;

    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings();
    }

    if (platformUpiId !== undefined) settings.platformUpiId = platformUpiId;
    if (platformQrCode !== undefined) settings.platformQrCode = platformQrCode;
    if (platformName) settings.platformName = platformName;
    if (supportEmail) settings.supportEmail = supportEmail;
    if (supportPhone !== undefined) settings.supportPhone = supportPhone;
    if (commissionRate !== undefined) settings.commissionRate = commissionRate;
    if (deliveryCommissionRate !== undefined)
      settings.deliveryCommissionRate = deliveryCommissionRate;
    if (minPayout !== undefined) settings.minPayout = minPayout;

    await settings.save();

    res.json({
      success: true,
      message: "Settings updated",
      settings,
    });
  } catch (error) {
    next(error);
  }
};