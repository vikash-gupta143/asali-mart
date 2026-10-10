import Order from "../models/Order.js";
import Product from "../models/Product.js";

// @desc    Get seller earnings analytics
// @route   GET /api/seller/earnings
// @access  Private (SELLER)
export const getSellerEarnings = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    // ✅ All delivered orders where this seller has items
    const deliveredOrders = await Order.find({
      "items.seller": sellerId,
      orderStatus: "DELIVERED",
    });

    // ⏳ All pending (not delivered, not cancelled) orders
    const pendingOrders = await Order.find({
      "items.seller": sellerId,
      orderStatus: { $nin: ["DELIVERED", "CANCELLED"] },
    });

    // Calculate earnings from seller's items only
    const calculateSellerEarning = (orders) => {
      let total = 0;
      orders.forEach((order) => {
        const sellerItems = order.items.filter(
          (i) => i.seller?.toString() === sellerId.toString()
        );
        const sellerItemsPrice = sellerItems.reduce(
          (sum, i) => sum + i.finalPrice * i.qty,
          0
        );
        const commission = Math.round((sellerItemsPrice * 5) / 100);
        total += sellerItemsPrice - commission;
      });
      return total;
    };

    const calculateSellerItemsPrice = (orders) => {
      let total = 0;
      orders.forEach((order) => {
        const sellerItems = order.items.filter(
          (i) => i.seller?.toString() === sellerId.toString()
        );
        total += sellerItems.reduce(
          (sum, i) => sum + i.finalPrice * i.qty,
          0
        );
      });
      return total;
    };

    const totalEarnings = calculateSellerEarning(deliveredOrders);
    const pendingEarnings = calculateSellerEarning(pendingOrders);
    const totalItemsPrice = calculateSellerItemsPrice(deliveredOrders);

    // 📅 This month
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const monthOrders = deliveredOrders.filter(
      (o) => new Date(o.deliveredAt || o.updatedAt) >= startOfMonth
    );
    const monthEarnings = calculateSellerEarning(monthOrders);

    // 📅 This week
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekOrders = deliveredOrders.filter(
      (o) => new Date(o.deliveredAt || o.updatedAt) >= startOfWeek
    );
    const weekEarnings = calculateSellerEarning(weekOrders);

    // 📦 Recent delivered orders (last 10)
    const recentOrders = await Order.find({
      "items.seller": sellerId,
      orderStatus: "DELIVERED",
    })
      .sort({ deliveredAt: -1 })
      .limit(10);

    const recentWithEarning = recentOrders.map((order) => {
      const sellerItems = order.items.filter(
        (i) => i.seller?.toString() === sellerId.toString()
      );
      const itemsPrice = sellerItems.reduce(
        (sum, i) => sum + i.finalPrice * i.qty,
        0
      );
      const commission = Math.round((itemsPrice * 5) / 100);
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        itemsPrice,
        commission,
        earning: itemsPrice - commission,
        deliveredAt: order.deliveredAt,
        items: sellerItems,
      };
    });

    res.json({
      success: true,
      earnings: {
        totalEarnings,
        pendingEarnings,
        totalItemsPrice,
        monthEarnings,
        weekEarnings,
        totalDeliveredOrders: deliveredOrders.length,
        totalPendingOrders: pendingOrders.length,
        totalCommission: totalItemsPrice - totalEarnings,
      },
      recentOrders: recentWithEarning,
    });
  } catch (error) {
    next(error);
  }
};