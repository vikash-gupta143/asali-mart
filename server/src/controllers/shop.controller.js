import Shop from "../models/Shop.js";
import Product from "../models/Product.js";

// 📐 Haversine formula — distance between two coordinates (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
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

// @desc    Get nearby shops
// @route   GET /api/shops/nearby?lat=..&lng=..&radius=5
// @access  Public
export const getNearbyShops = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const radiusKm = Number(radius);

    const shops = await Shop.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000, // meters
        },
      },
    }).populate("owner", "name email");

    // Add distance to each shop
    const shopsWithDistance = shops.map((shop) => {
      const [shopLng, shopLat] = shop.location.coordinates;
      const distance = calculateDistance(latitude, longitude, shopLat, shopLng);
      return {
        ...shop.toObject(),
        distance: Math.round(distance * 10) / 10, // 1 decimal
      };
    });

    res.json({
      success: true,
      count: shopsWithDistance.length,
      shops: shopsWithDistance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all shops
// @route   GET /api/shops
// @access  Public
export const getAllShops = async (req, res, next) => {
  try {
    const shops = await Shop.find({ isActive: true })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: shops.length, shops });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single shop
// @route   GET /api/shops/:id
// @access  Public
export const getShopById = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate("owner", "name email");
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    // Shop's products
    const products = await Product.find({ seller: shop.owner._id, isActive: true });

    res.json({ success: true, shop, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Create shop
// @route   POST /api/shops
// @access  Private (SELLER)
export const createShop = async (req, res, next) => {
  try {
    const existing = await Shop.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Shop already exists for this seller",
      });
    }

    const { name, description, phone, address, location, category } = req.body;

    if (!name || !phone || !location?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and location required",
      });
    }

    const shop = await Shop.create({
      name,
      description,
      phone,
      address,
      category: category || "General",
      location: {
        type: "Point",
        coordinates: location.coordinates, // [lng, lat]
      },
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update shop
// @route   PUT /api/shops/:id
// @access  Private (Owner)
export const updateShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    if (shop.owner.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const allowed = ["name", "description", "phone", "address", "logo", "banner", "category", "deliveryRadius", "isActive"];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) shop[f] = req.body[f];
    });

    if (req.body.location?.coordinates) {
      shop.location = {
        type: "Point",
        coordinates: req.body.location.coordinates,
      };
    }

    await shop.save();
    res.json({ success: true, message: "Shop updated", shop });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my shop
// @route   GET /api/shops/my/shop
// @access  Private (SELLER)
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

// @desc    Get nearby products (from nearby shops)
// @route   GET /api/shops/nearby-products?lat=..&lng=..&radius=5
// @access  Public
export const getNearbyProducts = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5, category, keyword } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);
    const radiusKm = Number(radius);

    // 1. Find nearby shops
    const shops = await Shop.find({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: radiusKm * 1000,
        },
      },
    });

    const shopIds = shops.map((s) => s._id);
    const sellerIds = shops.map((s) => s.owner);

    // Map seller → distance
    const sellerDistance = {};
    shops.forEach((shop) => {
      const [shopLng, shopLat] = shop.location.coordinates;
      sellerDistance[shop.owner.toString()] = Math.round(
        calculateDistance(latitude, longitude, shopLat, shopLng) * 10
      ) / 10;
    });

    // 2. Find products from these sellers
    let query = { seller: { $in: sellerIds }, isActive: true };
    if (category && category !== "All") query.category = category;
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    const products = await Product.find(query).populate("seller", "name shopName");

    // Add distance to products
    const productsWithDistance = products.map((p) => {
      const d = sellerDistance[p.seller._id.toString()] || 0;
      return { ...p.toObject(), distance: d };
    });

    // Sort by distance
    productsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: productsWithDistance.length,
      shopsCount: shops.length,
      products: productsWithDistance,
    });
  } catch (error) {
    next(error);
  }
};

export { calculateDistance };