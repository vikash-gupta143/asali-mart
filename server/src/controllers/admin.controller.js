import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalSellers,
      totalCustomers,
      totalProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "SELLER" }),
      User.countDocuments({ role: "CUSTOMER" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "PLACED" }),
      Order.countDocuments({ orderStatus: "DELIVERED" }),
      Order.countDocuments({ orderStatus: "CANCELLED" }),
    ]);

    // Revenue (only delivered orders)
    const revenueData = await Order.aggregate([
      { $match: { orderStatus: "DELIVERED" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // Recent orders
    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSellers,
        totalCustomers,
        totalProducts,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role && role !== "ALL") query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "ADMIN") {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate admin",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "ADMIN") {
      return res.status(400).json({ success: false, message: "Cannot delete admin" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products (admin)
// @route   GET /api/admin/products
export const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate("seller", "name email shopName")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product active
// @route   PUT /api/admin/products/:id/toggle
export const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"}`,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
export const deleteProductAdmin = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
export const getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== "ALL") query.orderStatus = status;

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/admin/orders/:id
export const deleteOrderAdmin = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, message: "Order deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue analytics
// @route   GET /api/admin/revenue
// @access  Private (ADMIN)
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const [
      totalRevenueData,
      totalCommissionData,
      totalSellerEarnings,
      deliveredOrders,
      monthRevenue,
      weekRevenue,
    ] = await Promise.all([
      // Total revenue
      Order.aggregate([
        { $match: { orderStatus: "DELIVERED" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      // Total commission
      Order.aggregate([
        { $match: { orderStatus: "DELIVERED" } },
        { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
      ]),
      // Total seller earnings
      Order.aggregate([
        { $match: { orderStatus: "DELIVERED" } },
        { $group: { _id: null, total: { $sum: "$sellerEarnings" } } },
      ]),
      Order.countDocuments({ orderStatus: "DELIVERED" }),
      // This month
      Order.aggregate([
        {
          $match: {
            orderStatus: "DELIVERED",
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      // This week
      Order.aggregate([
        {
          $match: {
            orderStatus: "DELIVERED",
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.json({
      success: true,
      revenue: {
        total: totalRevenueData[0]?.total || 0,
        commission: totalCommissionData[0]?.total || 0,
        sellerEarnings: totalSellerEarnings[0]?.total || 0,
        deliveredOrders,
        thisMonth: monthRevenue[0]?.total || 0,
        thisWeek: weekRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};