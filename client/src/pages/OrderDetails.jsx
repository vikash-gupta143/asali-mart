import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMapPin, FiPackage, FiX } from "react-icons/fi";
import { fetchOrderById, cancelOrderApi } from "../services/orderService";

const statusColors = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-yellow-100 text-yellow-700",
  PACKED: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusSteps = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      const data = await fetchOrderById(id);
      setOrder(data.order);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      setCancelling(true);
      await cancelOrderApi(id, "Cancelled by customer");
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="container-custom py-10 text-center">Loading...</div>;
  if (!order) return <div className="container-custom py-10 text-center">Order not found</div>;

  const canCancel = !["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].includes(order.orderStatus);
  const currentStep = statusSteps.indexOf(order.orderStatus);

  return (
    <div className="container-custom py-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-4"
      >
        <FiArrowLeft /> Back to Orders
      </Link>

      <div className="flex justify-between items-start flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-heading font-bold text-2xl">Order #{order.orderNumber}</h1>
          <p className="text-xs text-muted mt-1">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.orderStatus]}`}>
          {order.orderStatus.replace(/_/g, " ")}
        </span>
      </div>

      {/* Progress */}
      {order.orderStatus !== "CANCELLED" && (
        <div className="bg-white rounded-xl shadow-card p-5 mb-5">
          <h3 className="font-heading font-bold text-sm mb-4">Order Tracking</h3>
          <div className="flex justify-between items-start overflow-x-auto gap-2">
            {statusSteps.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center min-w-[70px]">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= currentStep ? "bg-primary text-white" : "bg-gray-200 text-muted"
                  }`}
                >
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <p className={`text-[10px] mt-2 text-center ${i <= currentStep ? "text-primary font-semibold" : "text-muted"}`}>
                  {s.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
              <FiPackage className="text-primary" /> Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <img src={item.image} className="w-16 h-16 rounded-lg object-cover" alt="" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted">{item.shopName}</p>
                    <p className="text-sm mt-1">
                      ₹{item.finalPrice} × {item.qty} ={" "}
                      <b className="text-primary">₹{item.finalPrice * item.qty}</b>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
              <FiMapPin className="text-primary" /> Shipping Address
            </h3>
            <p className="font-medium text-sm">{order.shippingAddress.name}</p>
            <p className="text-xs text-muted">{order.shippingAddress.phone}</p>
            <p className="text-sm text-muted mt-1">
              {order.shippingAddress.line1}, {order.shippingAddress.city} - {order.shippingAddress.pincode}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold mb-3">Price Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Items Price</span>
                <span>₹{order.itemsPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span>{order.deliveryCharge === 0 ? "FREE" : `₹${order.deliveryCharge}`}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold mb-2 text-sm">Payment</h3>
            <p className="text-sm">{order.paymentMode}</p>
            <p className="text-xs text-muted mt-1">Status: {order.paymentStatus}</p>
          </div>

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-danger text-danger font-semibold hover:bg-red-50 transition disabled:opacity-50"
            >
              <FiX /> {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;