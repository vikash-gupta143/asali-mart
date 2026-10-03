import { useState, useEffect } from "react";
import { FiDollarSign, FiTrendingUp, FiPackage } from "react-icons/fi";
import { fetchEarnings } from "../../services/deliveryService";

const Earnings = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchEarnings();
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

  return (
    <div className="space-y-5">
      <h1 className="font-heading font-bold text-2xl">Earnings</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary-light rounded-2xl p-5 text-white">
          <FiDollarSign className="text-2xl mb-2 opacity-80" />
          <p className="text-xs opacity-80">Today's Earnings</p>
          <p className="font-heading font-bold text-3xl">₹{data?.todayEarnings || 0}</p>
          <p className="text-xs opacity-80 mt-1">{data?.todayDeliveries || 0} deliveries</p>
        </div>

        <div className="bg-gradient-to-br from-secondary to-[#2a2a4e] rounded-2xl p-5 text-white">
          <FiTrendingUp className="text-2xl mb-2 opacity-80" />
          <p className="text-xs opacity-80">Total Earnings</p>
          <p className="font-heading font-bold text-3xl">₹{data?.totalEarnings || 0}</p>
          <p className="text-xs opacity-80 mt-1">{data?.totalDeliveries || 0} deliveries</p>
        </div>
      </div>

      {/* Delivery history */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-heading font-bold mb-3">Recent Deliveries</h2>
        {data?.deliveries?.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            No deliveries yet
          </p>
        ) : (
          <div className="space-y-2">
            {data?.deliveries?.slice(0, 10).map((d) => (
              <div
                key={d._id}
                className="flex justify-between items-center p-3 rounded-lg hover:bg-bg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                    <FiPackage />
                  </div>
                  <div>
                    <p className="text-sm font-medium">#{d.orderNumber}</p>
                    <p className="text-xs text-muted">
                      {new Date(d.deliveredAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-accent">+₹{d.deliveryEarnings}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;