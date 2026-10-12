import { useState, useEffect } from "react";
import {
  FiTrendingUp, FiShoppingBag, FiPackage, FiUsers,
  FiDollarSign, FiClock, FiAlertCircle, FiStar,
  FiBarChart2, FiCalendar, FiArrowUp, FiArrowDown,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";

const SalesAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("week"); // week, month, year

  const load = async () => {
    try {
      setLoading(true);
      const [analyticsRes, monthlyRes] = await Promise.all([
        api.get("/seller/analytics"),
        api.get("/seller/analytics/monthly-revenue"),
      ]);

      setAnalytics(analyticsRes.data.analytics);
      setMonthlyData(monthlyRes.data.monthlyData || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Analytics load nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Loading
  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted mt-3">Analytics load ho rahe hain...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="text-center py-20">
        <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-3" />
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={load}
          className="mt-4 px-6 py-2 rounded-xl bg-primary text-white font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const {
    overall,
    today,
    week,
    month,
    year,
    topProducts,
    revenueChart,
    peakHours,
    customers,
    lowStockProducts,
    wallet,
  } = analytics;

  // Get period stats
  const periodStats = {
    week,
    month,
    year,
  }[period];

  // Max revenue for chart scaling
  const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl">
            📊 Sales Analytics
          </h1>
          <p className="text-sm text-muted mt-1">
            Aapke business ka complete overview
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: "week", label: "7 Days" },
            { id: "month", label: "This Month" },
            { id: "year", label: "This Year" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                period === p.id
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-gray-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center">
              <FiDollarSign className="text-xl" />
            </div>
            <FiTrendingUp className="text-green-500 text-xl" />
          </div>
          <p className="text-xs text-green-700 font-semibold uppercase tracking-wider">
            Total Revenue
          </p>
          <p className="font-heading font-bold text-2xl text-green-800 mt-1">
            ₹{overall.totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Aaj: ₹{today.revenue.toLocaleString("en-IN")}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center">
              <FiShoppingBag className="text-xl" />
            </div>
          </div>
          <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">
            Total Orders
          </p>
          <p className="font-heading font-bold text-2xl text-blue-800 mt-1">
            {overall.totalOrders}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Aaj: {today.orders} orders
          </p>
        </div>

        {/* Items Sold */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center">
              <FiPackage className="text-xl" />
            </div>
          </div>
          <p className="text-xs text-purple-700 font-semibold uppercase tracking-wider">
            Items Sold
          </p>
          <p className="font-heading font-bold text-2xl text-purple-800 mt-1">
            {overall.totalItemsSold}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {overall.activeProducts} active products
          </p>
        </div>

        {/* Customers */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center">
              <FiUsers className="text-xl" />
            </div>
          </div>
          <p className="text-xs text-orange-700 font-semibold uppercase tracking-wider">
            Customers
          </p>
          <p className="font-heading font-bold text-2xl text-orange-800 mt-1">
            {customers.total}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {customers.repeat} repeat ({customers.retentionRate}%)
          </p>
        </div>
      </div>

      {/* Period Stats */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h2 className="font-heading font-bold text-lg mb-4">
          📅 {period === "week" ? "Last 7 Days" : period === "month" ? "This Month" : "This Year"} Performance
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-green-50">
            <p className="text-xs text-green-700 font-semibold">Revenue</p>
            <p className="font-heading font-bold text-xl text-green-800 mt-1">
              ₹{periodStats.revenue.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="text-center p-4 rounded-xl bg-blue-50">
            <p className="text-xs text-blue-700 font-semibold">Orders</p>
            <p className="font-heading font-bold text-xl text-blue-800 mt-1">
              {periodStats.orders}
            </p>
          </div>
          <div className="text-center p-4 rounded-xl bg-purple-50">
            <p className="text-xs text-purple-700 font-semibold">Items</p>
            <p className="font-heading font-bold text-xl text-purple-800 mt-1">
              {periodStats.items}
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Chart (Last 7 Days) */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            📈 Revenue (Last 7 Days)
          </h2>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-64 px-2">
          {revenueChart.map((day, i) => {
            const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
            const isToday = i === revenueChart.length - 1;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-[10px] font-semibold text-dark">
                  ₹{day.revenue > 999 ? `${Math.round(day.revenue / 1000)}k` : day.revenue}
                </div>
                <div className="flex-1 w-full flex items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all hover:opacity-80 ${
                      isToday
                        ? "bg-gradient-to-t from-primary to-orange-400"
                        : "bg-gradient-to-t from-blue-500 to-blue-400"
                    }`}
                    style={{
                      height: `${Math.max(height, 5)}%`,
                      minHeight: "8px",
                    }}
                  ></div>
                </div>
                <div className="text-[10px] text-muted font-medium">
                  {day.day}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
            🏆 Top Selling Products
          </h2>

          {topProducts.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              Abhi tak koi product sell nahi hua
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                >
                  {/* Rank */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0
                        ? "bg-yellow-400 text-yellow-900"
                        : i === 1
                        ? "bg-gray-300 text-gray-700"
                        : i === 2
                        ? "bg-orange-300 text-orange-900"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </div>

                  {/* Image */}
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted">
                      {product.qtySold} sold
                    </p>
                  </div>

                  {/* Revenue */}
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">
                      ₹{product.revenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peak Order Hours */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
            ⏰ Peak Order Time
          </h2>

          {peakHours.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              Data available nahi hai
            </p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {peakHours.map((h, i) => {
                  const hourLabel =
                    h.hour === 0
                      ? "12 AM"
                      : h.hour < 12
                      ? `${h.hour} AM`
                      : h.hour === 12
                      ? "12 PM"
                      : `${h.hour - 12} PM`;

                  return (
                    <div
                      key={h.hour}
                      className="flex items-center gap-3 p-3 rounded-xl bg-orange-50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{hourLabel}</p>
                        <p className="text-xs text-muted">
                          {h.orders} orders
                        </p>
                      </div>
                      <FiClock className="text-orange-500" />
                    </div>
                  );
                })}
              </div>

              {/* Hour-wise mini chart */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted mb-2">Hour-wise distribution:</p>
                <div className="flex items-end gap-0.5 h-16">
                  {analytics.hourWise.map((h, i) => {
                    const maxOrders = Math.max(
                      ...analytics.hourWise.map((x) => x.orders),
                      1
                    );
                    const height = (h.orders / maxOrders) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-blue-400 rounded-t hover:bg-blue-500 transition"
                        style={{
                          height: `${Math.max(height, 3)}%`,
                          minHeight: "3px",
                        }}
                        title={`${h.hour}:00 — ${h.orders} orders`}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-muted mt-1">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>11 PM</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Two Column Layout — Wallet + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Wallet */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
            💰 Wallet Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-green-50">
              <span className="text-sm font-medium text-green-700">
                Available Balance
              </span>
              <span className="font-bold text-green-800">
                ₹{wallet.available.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-yellow-50">
              <span className="text-sm font-medium text-yellow-700">
                Pending
              </span>
              <span className="font-bold text-yellow-800">
                ₹{wallet.pending.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50">
              <span className="text-sm font-medium text-blue-700">
                Total Earned
              </span>
              <span className="font-bold text-blue-800">
                ₹{wallet.totalEarned.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
              <span className="text-sm font-medium text-gray-700">
                Total Withdrawn
              </span>
              <span className="font-bold text-gray-800">
                ₹{wallet.totalWithdrawn.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
            <FiAlertCircle className="text-red-500" /> Low Stock Alerts
          </h2>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-green-600 font-medium">
                ✅ Sab products ka stock theek hai
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <div
                  key={product._id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    product.stock === 0
                      ? "bg-red-50 border border-red-200"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  {product.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted">
                      Stock: {product.stock} units
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      product.stock === 0
                        ? "bg-red-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {product.stock === 0 ? "OUT" : "LOW"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Revenue (12 months) */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
          📊 Monthly Revenue (Last 12 Months)
        </h2>

        <div className="flex items-end gap-1.5 h-48 overflow-x-auto pb-2">
          {monthlyData.map((m, i) => {
            const maxMonthly = Math.max(
              ...monthlyData.map((x) => x.revenue),
              1
            );
            const height = (m.revenue / maxMonthly) * 100;

            return (
              <div
                key={i}
                className="flex flex-col items-center gap-1 min-w-[50px] flex-1"
              >
                <div className="text-[9px] font-semibold text-dark whitespace-nowrap">
                  ₹{m.revenue > 999 ? `${Math.round(m.revenue / 1000)}k` : m.revenue}
                </div>
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg hover:opacity-80 transition"
                    style={{
                      height: `${Math.max(height, 3)}%`,
                      minHeight: "6px",
                    }}
                    title={`${m.month}: ₹${m.revenue} (${m.orders} orders)`}
                  ></div>
                </div>
                <div className="text-[9px] text-muted font-medium whitespace-nowrap">
                  {m.month.split(" ")[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;