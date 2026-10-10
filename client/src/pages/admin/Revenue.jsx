import { useState, useEffect } from "react";
import {
  FiDollarSign, FiTrendingUp, FiShoppingBag,
  FiBarChart2, FiAward, FiTruck, FiPercent,
} from "react-icons/fi";
import { fetchRevenueAnalytics } from "../../services/adminService";

const AdminRevenue = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchRevenueAnalytics();
        setData(res.revenue);
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

  const cards = [
    {
      label: "Total Sales",
      value: `₹${(data.total || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Platform Revenue",
      value: `₹${(data.platformRevenue || 0).toLocaleString()}`,
      icon: FiAward,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Seller Payouts",
      value: `₹${(data.sellerEarnings || 0).toLocaleString()}`,
      icon: FiTrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Delivered Orders",
      value: data.deliveredOrders || 0,
      icon: FiShoppingBag,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Revenue Analytics</h1>
        <p className="text-sm text-muted">Platform business overview</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-card p-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${c.color}`}
            >
              <c.icon />
            </div>
            <p className="text-2xl font-heading font-bold">{c.value}</p>
            <p className="text-xs text-muted mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Time Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary-light rounded-2xl p-6 text-white">
          <FiBarChart2 className="text-2xl mb-2 opacity-80" />
          <p className="text-xs opacity-80 uppercase tracking-wider">
            This Month
          </p>
          <p className="font-heading font-bold text-3xl mt-1">
            ₹{(data.thisMonth || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-secondary to-[#2a2a4e] rounded-2xl p-6 text-white">
          <FiBarChart2 className="text-2xl mb-2 opacity-80" />
          <p className="text-xs opacity-80 uppercase tracking-wider">
            This Week
          </p>
          <p className="font-heading font-bold text-3xl mt-1">
            ₹{(data.thisWeek || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* 🏢 Platform Revenue Breakdown */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-heading font-bold mb-4">
          🏢 Platform Revenue Breakdown
        </h2>
        <div className="space-y-3">
          {/* Commission */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-bg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <FiPercent />
              </div>
              <div>
                <p className="font-medium text-sm">Seller Commission</p>
                <p className="text-xs text-muted">
                  5% of product price
                </p>
              </div>
            </div>
            <p className="font-bold text-green-600">
              ₹{(data.commission || 0).toLocaleString()}
            </p>
          </div>

          {/* Delivery Margin */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-bg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <FiTruck />
              </div>
              <div>
                <p className="font-medium text-sm">Delivery Margin</p>
                <p className="text-xs text-muted">
                  20% of delivery charge
                </p>
              </div>
            </div>
            <p className="font-bold text-blue-600">
              ₹{(data.deliveryMargin || 0).toLocaleString()}
            </p>
          </div>

          {/* Platform Fee */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-bg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <FiDollarSign />
              </div>
              <div>
                <p className="font-medium text-sm">Platform Fee</p>
                <p className="text-xs text-muted">₹10 per order</p>
              </div>
            </div>
            <p className="font-bold text-purple-600">
              ₹{(data.platformFee || 0).toLocaleString()}
            </p>
          </div>

          {/* Total Platform Revenue */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-accent/10 border-2 border-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent text-white flex items-center justify-center">
                <FiAward />
              </div>
              <div>
                <p className="font-bold text-sm">Total Platform Revenue</p>
                <p className="text-xs text-muted">
                  Commission + Margin + Fee
                </p>
              </div>
            </div>
            <p className="font-bold text-accent text-lg">
              ₹{(data.platformRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 💵 Business Summary */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-heading font-bold mb-4">💵 Business Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg bg-bg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FiDollarSign />
              </div>
              <div>
                <p className="font-medium text-sm">Total Customer Payments</p>
                <p className="text-xs text-muted">
                  Products + Delivery + Fee
                </p>
              </div>
            </div>
            <p className="font-bold text-primary">
              ₹{(data.total || 0).toLocaleString()}
            </p>
          </div>

          <div className="flex justify-between items-center p-3 rounded-lg bg-bg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <FiTrendingUp />
              </div>
              <div>
                <p className="font-medium text-sm">Seller Payouts</p>
                <p className="text-xs text-muted">
                  Product price - 5% commission
                </p>
              </div>
            </div>
            <p className="font-bold text-blue-600">
              ₹{(data.sellerEarnings || 0).toLocaleString()}
            </p>
          </div>

          <div className="flex justify-between items-center p-3 rounded-lg bg-bg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <FiTruck />
              </div>
              <div>
                <p className="font-medium text-sm">Delivery Partner Payouts</p>
                <p className="text-xs text-muted">
                  80% of delivery charge
                </p>
              </div>
            </div>
            <p className="font-bold text-orange-600">
              ₹{(data.deliveryEarnings || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;