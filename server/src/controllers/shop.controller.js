import Shop from "../models/Shop.js";
import Product from "../models/Product.js";

import {
  getCurrentRadius,
  getCurrentTimeWindow,
  getDeliveryInfo,
  DELIVERY_CONFIG,
} from "../config/delivery.config.js";

// 📐 Haversine — distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// @desc    Get nearby shops (only APPROVED)
// @route   GET /api/shops/nearby?lat=..&lng=..&radius=5
export const getNearbyShops = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    // 🚚 Dynamic radius based on time
    const maxAllowedRadius = getCurrentRadius();
    const requestedRadius = radius ? Number(radius) : maxAllowedRadius;
    const finalRadius = Math.min(requestedRadius, maxAllowedRadius);

    const shops = await Shop.find({
      isActive: true,
      status: "APPROVED",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: finalRadius * 1000,
        },
      },
    }).populate("owner", "name email");

    const shopsWithDistance = shops.map((shop) => {
      const [shopLng, shopLat] = shop.location.coordinates;
      const distance = calculateDistance(latitude, longitude, shopLat, shopLng);
      const deliveryInfo = getDeliveryInfo(distance);

      return {
        ...shop.toObject(),
        distance: Math.round(distance * 10) / 10,
        deliveryInfo,
      };
    });

    res.json({
      success: true,
      count: shopsWithDistance.length,
      radius: finalRadius,
      timeWindow: getCurrentTimeWindow(),
      shops: shopsWithDistance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all shops (only APPROVED for public)
// @route   GET /api/shops
export const getAllShops = async (req, res, next) => {
  try {
    const shops = await Shop.find({ isActive: true, status: "APPROVED" })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: shops.length, shops });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single shop
// @route   GET /api/shops/:id
export const getShopById = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate("owner", "name email");
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    // Public only sees approved shops
    const isOwner = req.user && shop.owner._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === "ADMIN";

    if (shop.status !== "APPROVED" && !isOwner && !isAdmin) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    const products = await Product.find({
      seller: shop.owner._id,
      isActive: true,
    });

    res.json({ success: true, shop, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Create shop with KYC documents
// @route   POST /api/shops
// @access  Private (SELLER)
export const createShop = async (req, res, next) => {
  try {
    const existing = await Shop.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Shop already exists for this seller",
        shop: existing,
      });
    }

    const {
      name,
      description,
      phone,
      email,
      category,
      line1,
      city,
      state,
      pincode,
      landmark,
      longitude,
      latitude,
      gstNumber,
      panNumber,
      aadhaarNumber,
      shopLicenseNumber,
      registrationNumber,
      fssaiNumber,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      openingTime,
      closingTime,
    } = req.body;

    // Validation
    if (!name || !phone || !line1 || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and full address required",
      });
    }

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates required",
      });
    }

    // Documents from Cloudinary
    const files = req.files || {};

    const shop = await Shop.create({
      name,
      description,
      phone,
      email,
      category: category || "General",
      address: { line1, city, state, pincode, landmark },
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },

      // KYC
      legal: {
        gstNumber: gstNumber || "",
        panNumber: panNumber || "",
        aadhaarNumber: aadhaarNumber || "",
        shopLicenseNumber: shopLicenseNumber || "",
        registrationNumber: registrationNumber || "",
        fssaiNumber: fssaiNumber || "",
      },

      // Documents
      documents: {
        gstCertificate: files.gstCertificate?.[0]?.path || "",
        panCard: files.panCard?.[0]?.path || "",
        aadhaarCard: files.aadhaarCard?.[0]?.path || "",
        shopLicense: files.shopLicense?.[0]?.path || "",
        shopFrontPhoto: files.shopFrontPhoto?.[0]?.path || "",
        insideShopPhoto: files.insideShopPhoto?.[0]?.path || "",
        ownerPhoto: files.ownerPhoto?.[0]?.path || "",
        bankCheque: files.bankCheque?.[0]?.path || "",
      },

      // Bank
      bank: {
        accountHolderName: accountHolderName || "",
        accountNumber: accountNumber || "",
        ifscCode: ifscCode || "",
        bankName: bankName || "",
        branchName: branchName || "",
      },

      openingTime: openingTime || "",
      closingTime: closingTime || "",

      owner: req.user._id,
      status: "PENDING",       // ← Default pending
    });

    res.status(201).json({
      success: true,
      message:
        "Shop created! Admin will verify in 24-48 hours. Jab tak approve nahi hoti, customers ko nahi dikhegi.",
      shop,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shop
// @route   PUT /api/shops/:id
// @access  Private (Owner or ADMIN)
export const updateShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    if (
      shop.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Update basic fields
    const allowed = [
      "name", "description", "phone", "email", "category",
      "openingTime", "closingTime", "deliveryRadius", "minOrderValue",
    ];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) shop[f] = req.body[f];
    });

    // Address
    if (req.body.line1 || req.body.city || req.body.pincode) {
      shop.address = {
        line1: req.body.line1 || shop.address.line1,
        city: req.body.city || shop.address.city,
        state: req.body.state || shop.address.state,
        pincode: req.body.pincode || shop.address.pincode,
        landmark: req.body.landmark || shop.address.landmark,
      };
    }

    // Location
    if (req.body.longitude && req.body.latitude) {
      shop.location = {
        type: "Point",
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
      };
      // If owner updates location, reset status
      if (req.user.role !== "ADMIN") {
        shop.status = "PENDING";
      }
    }

    // Legal
    if (req.body.gstNumber !== undefined) shop.legal.gstNumber = req.body.gstNumber;
    if (req.body.panNumber !== undefined) shop.legal.panNumber = req.body.panNumber;
    if (req.body.aadhaarNumber !== undefined) shop.legal.aadhaarNumber = req.body.aadhaarNumber;
    if (req.body.fssaiNumber !== undefined) shop.legal.fssaiNumber = req.body.fssaiNumber;

    // Bank
    if (req.body.accountHolderName !== undefined) shop.bank.accountHolderName = req.body.accountHolderName;
    if (req.body.accountNumber !== undefined) shop.bank.accountNumber = req.body.accountNumber;
    if (req.body.ifscCode !== undefined) shop.bank.ifscCode = req.body.ifscCode;
    if (req.body.bankName !== undefined) shop.bank.bankName = req.body.bankName;
    if (req.body.branchName !== undefined) shop.bank.branchName = req.body.branchName;

    // Documents (if new files uploaded)
    const files = req.files || {};
    if (files.gstCertificate?.[0]) shop.documents.gstCertificate = files.gstCertificate[0].path;
    if (files.panCard?.[0]) shop.documents.panCard = files.panCard[0].path;
    if (files.aadhaarCard?.[0]) shop.documents.aadhaarCard = files.aadhaarCard[0].path;
    if (files.shopLicense?.[0]) shop.documents.shopLicense = files.shopLicense[0].path;
    if (files.shopFrontPhoto?.[0]) shop.documents.shopFrontPhoto = files.shopFrontPhoto[0].path;
    if (files.insideShopPhoto?.[0]) shop.documents.insideShopPhoto = files.insideShopPhoto[0].path;
    if (files.ownerPhoto?.[0]) shop.documents.ownerPhoto = files.ownerPhoto[0].path;
    if (files.bankCheque?.[0]) shop.documents.bankCheque = files.bankCheque[0].path;

    await shop.save();

    res.json({ success: true, message: "Shop updated", shop });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my shop
// @route   GET /api/shops/my/shop
export const getMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: "No shop found" });
    }
    res.json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby products (only from approved shops)
// @route   GET /api/shops/nearby-products
export const getNearbyProducts = async (req, res, next) => {
  try {
    const { lat, lng, radius, category, keyword } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    // 🚚 Dynamic radius
    const maxAllowedRadius = getCurrentRadius();
    const requestedRadius = radius ? Number(radius) : maxAllowedRadius;
    const finalRadius = Math.min(requestedRadius, maxAllowedRadius);

    const shops = await Shop.find({
      isActive: true,
      status: "APPROVED",
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: finalRadius * 1000,
        },
      },
    });

    const sellerIds = shops.map((s) => s.owner);

    const sellerDistance = {};
    shops.forEach((shop) => {
      const [shopLng, shopLat] = shop.location.coordinates;
      sellerDistance[shop.owner.toString()] =
        Math.round(calculateDistance(latitude, longitude, shopLat, shopLng) * 10) / 10;
    });

    let query = { seller: { $in: sellerIds }, isActive: true };
    if (category && category !== "All") query.category = category;
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    const products = await Product.find(query).populate("seller", "name shopName");

    const productsWithDistance = products.map((p) => {
      const d = sellerDistance[p.seller._id.toString()] || 0;
      const deliveryInfo = getDeliveryInfo(d);
      return {
        ...p.toObject(),
        distance: d,
        deliveryInfo,
      };
    });

    productsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: productsWithDistance.length,
      shopsCount: shops.length,
      radius: finalRadius,
      timeWindow: getCurrentTimeWindow(),
      products: productsWithDistance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin — Get all shops (with status filter)
// @route   GET /api/shops/admin/all
// @access  Private (ADMIN)
export const adminGetAllShops = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== "ALL") query.status = status;

    const shops = await Shop.find(query)
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: shops.length, shops });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin — Approve/Reject shop
// @route   PUT /api/shops/:id/verify
// @access  Private (ADMIN)
export const verifyShop = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    if (action === "approve") {
      shop.status = "APPROVED";
      shop.verified = true;
      shop.approvedBy = req.user._id;
      shop.approvedAt = new Date();
      shop.rejectionReason = "";
    } else if (action === "reject") {
      shop.status = "REJECTED";
      shop.verified = false;
      shop.rejectionReason = reason || "Documents not valid";
    } else if (action === "suspend") {
      shop.status = "SUSPENDED";
    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    await shop.save();

    res.json({
      success: true,
      message: `Shop ${action}d successfully`,
      shop,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Check if delivery available for a pincode
// @route   POST /api/shops/check-pincode
// @access  Public
export const checkPincode = async (req, res, next) => {
  try {
    const { pincode, lat, lng } = req.body;

    if (!pincode || pincode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-digit pincode required",
      });
    }

    // 📏 Calculate current radius based on time
    const { getCurrentRadius, getCurrentTimeWindow } = await import("../config/delivery.config.js");
    const maxRadius = getCurrentRadius();
    const timeWindow = getCurrentTimeWindow();

    // 🔍 Find approved shops with this pincode
    const shopsInPincode = await Shop.find({
      isActive: true,
      status: "APPROVED",
      "address.pincode": pincode,
    });

    // ✅ Agar customer ke location ke paas shop hai
    if (lat && lng && shopsInPincode.length === 0) {
      // Nearby shops check karo
      const nearbyShops = await Shop.find({
        isActive: true,
        status: "APPROVED",
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)],
            },
            $maxDistance: maxRadius * 1000,
          },
        },
      }).limit(1);

      if (nearbyShops.length === 0) {
        return res.json({
          success: true,
          available: false,
          message: `Abhi ${maxRadius} km tak delivery available hai (${timeWindow}). Ye pincode door hai.`,
          maxRadius,
          timeWindow,
        });
      }
    }

    // ✅ Agar shops hain pincode me
    if (shopsInPincode.length > 0) {
      return res.json({
        success: true,
        available: true,
        message: `✅ Delivery available at ${pincode}`,
        shopsCount: shopsInPincode.length,
        maxRadius,
        timeWindow,
      });
    }

    // Default available
    res.json({
      success: true,
      available: true,
      message: `✅ Delivery available`,
      maxRadius,
      timeWindow,
    });
  } catch (error) {
    next(error);
  }
};

export { calculateDistance };