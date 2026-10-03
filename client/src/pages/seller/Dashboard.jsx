import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiPackage, FiShoppingBag, FiDollarSign, FiTrendingUp,
  FiPlusCircle, FiEye, FiArrowRight,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { fetchMyProducts } from "../../services/productService";

const Dashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyProducts();
        setProducts(data.products || []);
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

  const stats = [
    { label: "Total Products", value: totalProducts, icon: FiPackage, color: "bg-blue-50 text-blue-600" },
    { label: "Total Stock", value: totalStock, icon: FiShoppingBag, color: "bg-green-50 text-green-600" },
    { label: "Inventory Value", value: `₹${totalValue.toLocaleString()}`, icon: FiDollarSign, color: "bg-orange-50 text-orange-600" },
    { label: "Low Stock", value: lowStock, icon: FiTrendingUp, color: "bg-red-50 text-red-600" },
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-card p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${s.color}`}>
              <s.icon />
            </div>
            <p className="text-2xl font-heading font-bold text-dark">
              {loading ? "..." : s.value}
            </p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </div>
        ))}
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
            to="/"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary text-white flex items-center justify-center">
              <FiEye />
            </div>
            <div>
              <p className="font-semibold text-sm text-dark">View Store</p>
              <p className="text-xs text-muted">See how customers see</p>
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