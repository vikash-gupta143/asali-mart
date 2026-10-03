import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiPackage, FiArrowRight } from "react-icons/fi";
import { fetchMyOrders } from "../services/orderService";

const statusColors = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-yellow-100 text-yellow-700",
  PACKED: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyOrders();
        setOrders(data.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="container-custom py-10 text-center text-muted">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="container-custom py-20 text-center">
        <FiPackage className="text-5xl text-muted mx-auto mb-4" />
        <h1 className="font-heading font-bold text-2xl mb-2">No orders yet</h1>
        <p className="text-sm text-muted mb-4">Start shopping to place your first order</p>
        <Link to="/products" className="text-primary font-semibold hover:underline">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-6">
      <h1 className="font-heading font-bold text-2xl mb-5">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-xl shadow-card p-4">
            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
              <div>
                <p className="font-semibold text-sm">Order #{order.orderNumber}</p>
                <p className="text-xs text-muted">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.orderStatus]}`}>
                {order.orderStatus.replace(/_/g, " ")}
              </span>
            </div>

            <div className="space-y-3 mb-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src={item.image} className="w-14 h-14 rounded-lg object-cover" alt={item.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted">Qty: {item.qty} × ₹{item.finalPrice}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <span className="font-bold text-primary">₹{order.totalAmount}</span>
              <Link
                to={`/orders/${order._id}`}
                className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                View Details <FiArrowRight />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;