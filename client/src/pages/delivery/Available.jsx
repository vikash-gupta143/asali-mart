import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPackage, FiMapPin, FiDollarSign, FiRefreshCw } from "react-icons/fi";
import { fetchAvailableOrders, acceptDeliveryApi } from "../../services/deliveryService";

const Available = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAvailableOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (orderId) => {
    if (!window.confirm("Accept this delivery?")) return;
    try {
      setAccepting(orderId);
      await acceptDeliveryApi(orderId);
      navigate("/delivery/my-deliveries");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept");
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl">Available Orders</h1>
          <p className="text-sm text-muted">{orders.length} orders waiting</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl bg-white shadow-card hover:bg-bg"
        >
          <FiRefreshCw />
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiPackage className="text-5xl text-muted mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-2">No orders available</h3>
          <p className="text-sm text-muted">Check back later for new deliveries</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-card p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-sm">Order #{order.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </div>

              {/* Pickup */}
              <div className="space-y-2 mb-3 text-xs">
                <div className="flex items-start gap-2">
                  <FiPackage className="text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Pickup</p>
                    <p className="text-muted">
                      {order.items?.[0]?.shopName || "Shop"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FiMapPin className="text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold">Deliver to</p>
                    <p className="text-muted">
                      {order.shippingAddress?.line1}, {order.shippingAddress?.city}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div>
                  <p className="text-xs text-muted">Earning</p>
                  <p className="font-bold text-accent">₹{order.deliveryEarnings || 24}</p>
                </div>
                <button
                  onClick={() => handleAccept(order._id)}
                  disabled={accepting === order._id}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
                >
                  {accepting === order._id ? "Accepting..." : "Accept"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Available;