import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// ============================================================
// 📊 SELLER ANALYTICS — Complete Dashboard Data
// ============================================================
export const getSellerAnalytics = async (req, res, next) => {
  try {
    const sellerId = req.user._id;

    // Date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Base query — sirf is seller ke items
    const sellerOrderFilter = {
      "items.seller": sellerId,
      orderStatus: { $nin: ["CANCELLED"] },
    };

    // ============================================================
    // 📊 1. OVERALL STATS
    // ============================================================
    const allOrders = await Order.find(sellerOrderFilter);

    let totalRevenue = 0;
    let totalOrders = allOrders.length;
    let totalItemsSold = 0;

    allOrders.forEach((order) => {
      order.items
        .filter((item) => item.seller?.toString() === sellerId.toString())
        .forEach((item) => {
          totalRevenue += item.finalPrice * item.qty;
          totalItemsSold += item.qty;
        });
    });

    // ============================================================
    // 📅 2. TODAY / WEEK / MONTH STATS
    // ============================================================
    const calculatePeriodStats = (fromDate) => {
      const orders = allOrders.filter((o) => new Date(o.createdAt) >= fromDate);
      let revenue = 0;
      let items = 0;

      orders.forEach((order) => {
        order.items
          .filter((item) => item.seller?.toString() === sellerId.toString())
          .forEach((item) => {
            revenue += item.finalPrice * item.qty;
            items += item.qty;
          });
      });

      return {
        revenue,
        orders: orders.length,
        items,
      };
    };

    const todayStats = calculatePeriodStats(startOfToday);
    const weekStats = calculatePeriodStats(startOfWeek);
    const monthStats = calculatePeriodStats(startOfMonth);
    const yearStats = calculatePeriodStats(startOfYear);

    // ============================================================
    // 🏆 3. TOP SELLING PRODUCTS
    // ============================================================
    const productSales = {};

    allOrders.forEach((order) => {
      order.items
        .filter((item) => item.seller?.toString() === sellerId.toString())
        .forEach((item) => {
          const productId = item.product?.toString();
          if (!productId) return;

          if (!productSales[productId]) {
            productSales[productId] = {
              productId,
              name: item.name,
              image: item.image,
              qtySold: 0,
              revenue: 0,
            };
          }

          productSales[productId].qtySold += item.qty;
          productSales[productId].revenue += item.finalPrice * item.qty;
        });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 5);

    // ============================================================
    // 📈 4. REVENUE CHART (Last 7 days)
    // ============================================================
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayOrders = allOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });

      let revenue = 0;
      dayOrders.forEach((order) => {
        order.items
          .filter((item) => item.seller?.toString() === sellerId.toString())
          .forEach((item) => {
            revenue += item.finalPrice * item.qty;
          });
      });

      last7Days.push({
        date: date.toISOString().split("T")[0],
        day: date.toLocaleDateString("en-IN", { weekday: "short" }),
        revenue,
        orders: dayOrders.length,
      });
    }

    // ============================================================
    // ⏰ 5. PEAK ORDER TIME (Hour-wise)
    // ============================================================
    const hourWise = Array(24)
      .fill(0)
      .map((_, i) => ({ hour: i, orders: 0 }));

    allOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourWise[hour].orders += 1;
    });

    const peakHours = hourWise
      .filter((h) => h.orders > 0)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 3);

    // ============================================================
    // 👥 6. CUSTOMER RETENTION
    // ============================================================
    const customerOrders = {};

    allOrders.forEach((order) => {
      const customerId = order.user?.toString();
      if (!customerId) return;

      if (!customerOrders[customerId]) {
        customerOrders[customerId] = 0;
      }
      customerOrders[customerId] += 1;
    });

    const totalCustomers = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter(
      (count) => count > 1
    ).length;
    const retentionRate =
      totalCustomers > 0
        ? Math.round((repeatCustomers / totalCustomers) * 100)
        : 0;

    // ============================================================
    // 📦 7. LOW STOCK ALERTS
    // ============================================================
    const lowStockProducts = await Product.find({
      seller: sellerId,
      stock: { $lte: 10 },
      isActive: true,
    })
      .select("name stock images price")
      .sort({ stock: 1 })
      .limit(10);

    // ============================================================
    // 📊 8. PRODUCT STATS
    // ============================================================
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    const activeProducts = await Product.countDocuments({
      seller: sellerId,
      isActive: true,
    });
    const outOfStock = await Product.countDocuments({
      seller: sellerId,
      stock: 0,
    });

    // ============================================================
    // 💰 9. REVENUE BREAKDOWN
    // ============================================================
    const seller = await User.findById(sellerId).select("wallet name");

    // ============================================================
    // 📤 RESPONSE
    // ============================================================
    res.status(200).json({
      success: true,
      analytics: {
        // Overall
        overall: {
          totalRevenue,
          totalOrders,
          totalItemsSold,
          totalProducts,
          activeProducts,
          outOfStock,
        },

        // Today / Week / Month / Year
        today: todayStats,
        week: weekStats,
        month: monthStats,
        year: yearStats,

        // Top Products
        topProducts,

        // Revenue Chart (Last 7 days)
        revenueChart: last7Days,

        // Peak Order Time
        peakHours,
        hourWise,

        // Customer Retention
        customers: {
          total: totalCustomers,
          repeat: repeatCustomers,
          retentionRate,
        },

        // Low Stock
        lowStockProducts,

        // Wallet
        wallet: {
          available: seller?.wallet?.available || 0,
          pending: seller?.wallet?.pending || 0,
          totalEarned: seller?.wallet?.totalEarned || 0,
          totalWithdrawn: seller?.wallet?.totalWithdrawn || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 📊 SELLER — Monthly Revenue (Last 12 months)
// ============================================================
export const getMonthlyRevenue = async (req, res, next) => {
  try {
    const sellerId = req.user._id;
    const now = new Date();

    const monthlyData = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const orders = await Order.find({
        "items.seller": sellerId,
        orderStatus: { $nin: ["CANCELLED"] },
        createdAt: { $gte: monthStart, $lt: monthEnd },
      });

      let revenue = 0;
      orders.forEach((order) => {
        order.items
          .filter((item) => item.seller?.toString() === sellerId.toString())
          .forEach((item) => {
            revenue += item.finalPrice * item.qty;
          });
      });

      monthlyData.push({
        month: monthStart.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
        monthKey: monthStart.toISOString().slice(0, 7),
        revenue,
        orders: orders.length,
      });
    }

    res.status(200).json({
      success: true,
      monthlyData,
    });
  } catch (error) {
    next(error);
  }
};