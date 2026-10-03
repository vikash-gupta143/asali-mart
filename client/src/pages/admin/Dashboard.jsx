import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers, FiShoppingBag, FiPackage, FiDollarSign,
  FiClock, FiCheckCircle, FiXCircle, FiArrowRight,
} from "react-icons/fi";
import { fetchAdminStats } from "../../services/adminService";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAdminStats();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="text-muted">Loading...</div>;
  if (!data) return <div className="text-danger">Failed to load</div>;

  const { stats, recentOrders } = data;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: FiUsers, color: "bg-blue-50 text-blue-600" },
    { label: "Sellers", value: stats.totalSellers, icon: FiShoppingBag, color: "bg-purple-50 text-purple-600" },
    { label: "Products", value: stats.totalProducts, icon: FiPackage, color: "bg-orange-50 text-orange-600" },
    { label: "Total Orders", value: stats.totalOrders, icon: FiCheckCircle, color: "bg-green-50 text-green-600" },
    { label: "Pending", value: stats.pendingOrders, icon: FiClock, color: "bg-yellow-50 text-yellow-600" },
    { label: "Delivered", value: stats.deliveredOrders, icon: FiCheckCircle, color: "bg-emerald-50 text-emerald-600" },
    { label: "Cancelled", value: stats.cancelledOrders, icon: FiXCircle, color: "bg-red-50 text-red-600" },
    { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: FiDollarSign, color: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Admin Dashboard</h1>
        <p className="text-sm text-muted">Overview of AsaliMart</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-card p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${c.color}`}>
              <c.icon />
            </div>
            <p className="text-2xl font-heading font-bold">{c.value}</p>
            <p className="text-xs text-muted mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading font-bold text-lg">Recent Orders</h2>
          <Link to="/admin/orders" className="text-primary text-sm font-semibold flex items-center gap-1">
            View All <FiArrowRight />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div key={o._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">#{o.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {o.user?.name} • {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-bold text-primary text-sm">₹{o.totalAmount}</p>
                <span className="text-xs px-2 py-1 rounded-md bg-bg font-semibold">
                  {o.orderStatus.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;