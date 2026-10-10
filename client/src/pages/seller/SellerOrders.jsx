import { useState, useEffect } from "react";
import { FiShoppingBag } from "react-icons/fi";
import { fetchSellerOrders, updateOrderStatusApi } from "../../services/orderService";

const statusColors = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-yellow-100 text-yellow-700",
  PACKED: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusFlow = {
  PLACED: "CONFIRMED",
  CONFIRMED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchSellerOrders();
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

  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      await updateOrderStatusApi(orderId, newStatus);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl">Orders</h1>
        <p className="text-sm text-muted">{orders.length} orders total</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiShoppingBag className="text-5xl text-muted mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-2">No orders yet</h3>
          <p className="text-sm text-muted">
            Orders from customers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-card p-4">
              <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                <div>
                  <p className="font-semibold text-sm">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")} •{" "}
                    {order.shippingAddress?.name}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.orderStatus]}`}
                >
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      className="w-12 h-12 rounded-lg object-cover"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted">
                        Qty: {item.qty} × ₹{item.finalPrice}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="p-3 rounded-lg bg-bg mb-3">
                <p className="text-xs text-muted mb-1">Deliver to:</p>
                <p className="text-xs font-medium">
                  {order.shippingAddress?.line1},{" "}
                  {order.shippingAddress?.city} -{" "}
                  {order.shippingAddress?.pincode}
                </p>
                <p className="text-xs text-muted">
                  📞 {order.shippingAddress?.phone}
                </p>
              </div>

              {/* 💰 Earning Breakdown */}
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 mb-3 space-y-1.5 text-xs">
                <p className="font-semibold text-dark mb-1">💰 Your Earning</p>

                <div className="flex justify-between">
                  <span className="text-muted">Product Price</span>
                  <span className="font-medium">₹{order.itemsPrice}</span>
                </div>

                <div className="flex justify-between text-red-600">
                  <span>
                    Commission ({order.commissionRate || 5}%)
                  </span>
                  <span>-₹{order.commissionAmount || 0}</span>
                </div>

                <div className="flex justify-between font-bold text-accent pt-1 border-t border-green-200">
                  <span>You will get</span>
                  <span>₹{order.sellerEarning || 0}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-3 border-t">
                <div>
                  <p className="text-xs text-muted">Customer paid</p>
                  <p className="font-bold text-primary">
                    ₹{order.totalAmount}
                  </p>
                  <p className="text-[10px] text-muted">
                    (incl. delivery + platform fee)
                  </p>
                </div>

                {order.orderStatus === "CANCELLED" ? (
                  <span className="text-xs text-danger font-semibold">
                    Cancelled
                  </span>
                ) : order.orderStatus === "DELIVERED" ? (
                  <span className="text-xs text-accent font-semibold">
                    ✓ Delivered
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      updateStatus(order._id, statusFlow[order.orderStatus])
                    }
                    disabled={updating === order._id}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition disabled:opacity-50"
                  >
                    {updating === order._id
                      ? "Updating..."
                      : `Mark as ${statusFlow[order.orderStatus].replace(/_/g, " ")}`}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;