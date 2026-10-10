import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp,
  FiPlusCircle, FiEye, FiArrowRight, FiClock, FiCheckCircle,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { fetchMyProducts } from "../../services/productService";
import { fetchSellerEarnings } from "../../services/sellerService";

const Dashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [productsData, earningsData] = await Promise.all([
          fetchMyProducts().catch(() => null),
          fetchSellerEarnings().catch(() => null),
        ]);

        if (productsData) setProducts(productsData.products || []);
        if (earningsData) setEarnings(earningsData.earnings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalValue = products.reduce(
    (sum, p) => sum + (p.finalPrice ?? p.price) * (p.stock || 0),
    0
  );
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;

  const productStats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: FiPackage,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Stock",
      value: totalStock,
      icon: FiShoppingBag,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Inventory Value",
      value: `₹${totalValue.toLocaleString()}`,
      icon: FiDollarSign,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Low Stock",
      value: lowStock,
      icon: FiTrendingUp,
      color: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white">
        <h1 className="font-heading font-bold text-2xl mb-1">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-white/80 text-sm">
          Here's what's happening with your shop today
        </p>
      </div>

      {/* 💰 Earnings Cards */}
      {earnings && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-heading font-bold text-lg">💰 Earnings</h2>
            <Link
              to="/seller/earnings"
              className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition"
            >
              View Details <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Earnings */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-card p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <FiDollarSign className="text-xl opacity-90" />
                <p className="text-xs opacity-90">Total Earnings</p>
              </div>
              <p className="font-heading font-bold text-2xl">
                ₹{earnings.totalEarnings?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] opacity-80 mt-1">
                {earnings.totalDeliveredOrders || 0} delivered orders
              </p>
            </div>

            {/* Pending Payout */}
            <div className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiClock className="text-orange-500 text-xl" />
                <p className="text-xs text-muted">Pending Payout</p>
              </div>
              <p className="font-heading font-bold text-2xl text-dark">
                ₹{earnings.pendingEarnings?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] text-muted mt-1">
                {earnings.totalPendingOrders || 0} orders in progress
              </p>
            </div>

            {/* This Month */}
            <div className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="text-blue-500 text-xl" />
                <p className="text-xs text-muted">This Month</p>
              </div>
              <p className="font-heading font-bold text-2xl text-dark">
                ₹{earnings.monthEarnings?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] text-muted mt-1">Monthly earnings</p>
            </div>

            {/* This Week */}
            <div className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiCheckCircle className="text-purple-500 text-xl" />
                <p className="text-xs text-muted">This Week</p>
              </div>
              <p className="font-heading font-bold text-2xl text-dark">
                ₹{earnings.weekEarnings?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] text-muted mt-1">Weekly earnings</p>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Product Stats */}
      <div>
        <h2 className="font-heading font-bold text-lg mb-3">📦 Product Stats</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {productStats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-card p-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${s.color}`}
              >
                <s.icon />
              </div>
              <p className="text-2xl font-heading font-bold text-dark">
                {loading ? "..." : s.value}
              </p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            to="/seller/add-product"
            className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition"
          >
            <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
              <FiPlusCircle />
            </div>
            <div>
              <p className="font-semibold text-sm text-dark">Add Product</p>
              <p className="text-xs text-muted">List new product</p>
            </div>
          </Link>

          <Link
            to="/seller/products"
            className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 transition"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <FiPackage />
            </div>
            <div>
              <p className="font-semibold text-sm text-dark">My Products</p>
              <p className="text-xs text-muted">Manage inventory</p>
            </div>
          </Link>

          <Link
            to="/seller/earnings"
            className="flex items-center gap-3 p-4 rounded-xl bg-green-50 hover:bg-green-100 border border-green-100 transition"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center">
              <FiDollarSign />
            </div>
            <div>
              <p className="font-semibold text-sm text-dark">Earnings</p>
              <p className="text-xs text-muted">View payouts</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading font-bold text-lg">Recent Products</h2>
          <Link
            to="/seller/products"
            className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition"
          >
            View All <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <FiPackage className="text-4xl text-muted mx-auto mb-3" />
            <p className="text-sm text-muted mb-3">No products yet</p>
            <Link
              to="/seller/add-product"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition"
            >
              <FiPlusCircle /> Add First Product
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {products.slice(0, 5).map((p) => (
              <div
                key={p._id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg transition"
              >
                <img
                  src={p.images?.[0]}
                  className="w-12 h-12 rounded-lg object-cover"
                  alt={p.name}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted">
                    ₹{p.finalPrice ?? p.price} • Stock: {p.stock}
                  </p>
                </div>
                <Link
                  to={`/product/${p._id}`}
                  className="text-xs text-primary font-semibold"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;