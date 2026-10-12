import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowLeft, FiMapPin, FiPackage, FiX,
  FiPhone, FiTruck, FiTag, FiStar,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { fetchOrderById, cancelOrderApi } from "../services/orderService";
import { useSocket } from "../context/SocketContext";
import LiveTrackingMap from "../components/common/LiveTrackingMap";
import { FiRefreshCw, FiClock } from "react-icons/fi";
import DeliveryRatingModal from "../components/delivery/DeliveryRatingModal";
import api from "../services/api";

const statusColors = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-yellow-100 text-yellow-700",
  PACKED: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusSteps = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  const socket = useSocket();

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

  // 🆕 Return window countdown timer
  useEffect(() => {
    if (!order?.returnDeadline) return;

    const updateTimer = () => {
      const now = new Date();
      const deadline = new Date(order.returnDeadline);
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [order]);

  // 🆕 Check if already rated
  useEffect(() => {
    const checkRating = async () => {
      if (
        !order ||
        order.orderStatus !== "DELIVERED" ||
        !order.deliveryPartner
      )
        return;

      try {
        const res = await api.get(`/delivery-ratings/order/${order._id}`);
        if (res.data.rating) {
          setExistingRating(res.data.rating);
        }
      } catch (err) {
        // No rating yet — koi issue nahi
      }
    };

    checkRating();
  }, [order]);

  // 🔔 Real-time order updates via Socket.io
  useEffect(() => {
    if (!socket || !order) return;

    const handleUpdate = (data) => {
      if (data.orderId === id || data.orderId === order._id) {
        console.log("🔔 Order update:", data);

        try {
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.4;
          audio.play().catch(() => {});
        } catch (e) {}

        toast.success(data.message, { duration: 5000 });
        load();
      }
    };

    socket.on("order:status", handleUpdate);
    socket.on("order:accepted", handleUpdate);
    socket.on("order:pickedup", handleUpdate);
    socket.on("order:delivered", handleUpdate);

    return () => {
      socket.off("order:status", handleUpdate);
      socket.off("order:accepted", handleUpdate);
      socket.off("order:pickedup", handleUpdate);
      socket.off("order:delivered", handleUpdate);
    };
  }, [socket, id, order]);

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

  if (loading)
    return <div className="container-custom py-10 text-center">Loading...</div>;
  if (!order)
    return (
      <div className="container-custom py-10 text-center">Order not found</div>
    );

  const canCancel = ![
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ].includes(order.orderStatus);
  const currentStep = statusSteps.indexOf(order.orderStatus);

  // 🆕 Return window check
  const isReturnWindowOpen =
    order.orderStatus === "DELIVERED" &&
    order.returnDeadline &&
    new Date() < new Date(order.returnDeadline) &&
    (!order.returnStatus || order.returnStatus === "NONE");

  // 🆕 Return status text/color
  const getReturnStatusDisplay = () => {
    if (!order.returnStatus || order.returnStatus === "NONE") return null;

    const statusMap = {
      REQUESTED: { text: "🔄 Return Requested", color: "bg-yellow-100 text-yellow-700" },
      APPROVED: { text: "✅ Return Approved", color: "bg-blue-100 text-blue-700" },
      REJECTED: { text: "❌ Return Rejected", color: "bg-red-100 text-red-700" },
      PICKUP_SCHEDULED: { text: "🚚 Pickup Scheduled", color: "bg-indigo-100 text-indigo-700" },
      PICKED_UP: { text: "📦 Picked Up", color: "bg-purple-100 text-purple-700" },
      RECEIVED: { text: "📥 Received by Seller", color: "bg-cyan-100 text-cyan-700" },
      REFUND_INITIATED: { text: "💸 Refund Initiated", color: "bg-orange-100 text-orange-700" },
      COMPLETED: { text: "🎉 Return Completed", color: "bg-green-100 text-green-700" },
      DISPUTED: { text: "⚠️ Disputed", color: "bg-red-100 text-red-700" },
    };

    return statusMap[order.returnStatus] || null;
  };

  const returnStatusDisplay = getReturnStatusDisplay();

  // 🆕 Payment status nikalo (dono fields se)
  const actualPaymentStatus =
    order.paymentDetails?.status || order.paymentStatus || "PENDING";

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
          <h1 className="font-heading font-bold text-2xl">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-muted mt-1">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.orderStatus]}`}
        >
          {order.orderStatus.replace(/_/g, " ")}
        </span>
      </div>

      {/* 🔐 OTP Section */}
      {order.deliveryOTP &&
        !order.deliveryOTPVerified &&
        ["SHIPPED", "OUT_FOR_DELIVERY"].includes(order.orderStatus) && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-dashed border-primary rounded-2xl p-6 mb-5 text-center">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              🔐 Delivery OTP
            </p>
            <div className="flex justify-center gap-3 mb-4">
              {order.deliveryOTP.split("").map((digit, i) => (
                <div
                  key={i}
                  className="w-14 h-16 bg-white rounded-xl shadow-card flex items-center justify-center border-2 border-primary/20"
                >
                  <span className="font-heading font-bold text-3xl text-primary">
                    {digit}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-dark font-medium mb-1">
              Delivery partner ko ye OTP batayein
            </p>
            <p className="text-xs text-muted">
              ⚠️ OTP share karne ke baad hi delivery complete hogi
            </p>
          </div>
        )}

      {/* 🚚 Delivery Partner Info */}
      {order.deliveryPartner && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
            🚚 Your Delivery Partner
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
              {order.deliveryPartner.name?.[0]?.toUpperCase() || "D"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-dark">
                {order.deliveryPartner.name}
              </p>
              <p className="text-xs text-muted">
                📞 {order.deliveryPartner.phone || "—"}
              </p>
            </div>
            {order.deliveryPartner.phone && (
              <a
                href={`tel:${order.deliveryPartner.phone}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600"
              >
                <FiPhone /> Call
              </a>
            )}
          </div>
        </div>
      )}

      {/* ⭐ RATING SECTION — Only for DELIVERED orders */}
      {order.orderStatus === "DELIVERED" && order.deliveryPartner && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-5 mb-5">
          {existingRating ? (
            // Already rated
            <div className="text-center">
              <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2">
                ⭐ Your Rating
              </p>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`text-2xl ${
                      star <= existingRating.rating
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    style={{
                      fill:
                        star <= existingRating.rating ? "#fbbf24" : "transparent",
                    }}
                  />
                ))}
              </div>
              {existingRating.feedback && (
                <p className="text-xs text-gray-700 italic mt-2">
                  "{existingRating.feedback}"
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-2">
                Rated on{" "}
                {new Date(existingRating.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          ) : (
            // Not rated yet
            <div className="text-center">
              <p className="text-sm font-semibold text-yellow-800 mb-3">
                🎉 Delivery complete! Rate your delivery partner
              </p>
              <button
                onClick={() => setShowRatingModal(true)}
                className="px-6 py-3 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition inline-flex items-center gap-2"
              >
                <FiStar /> Rate Delivery
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🔄 RETURN WINDOW + STATUS SECTION */}
      {order.orderStatus === "DELIVERED" && (
        <>
          {/* Countdown Timer — agar window open hai */}
          {isReturnWindowOpen && timeRemaining && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center text-2xl">
                  ⏰
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-orange-900">
                    Return Window Open!
                  </p>
                  <p className="text-xs text-orange-700">
                    Koi issue hai? Abhi return request daalein
                  </p>
                </div>
              </div>

              {/* Timer Display */}
              <div className="flex justify-center gap-2 mb-4">
                <div className="bg-white rounded-xl px-4 py-2 text-center min-w-[60px]">
                  <p className="font-heading font-bold text-2xl text-orange-600">
                    {String(timeRemaining.hours).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-muted uppercase">Hours</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 text-center min-w-[60px]">
                  <p className="font-heading font-bold text-2xl text-orange-600">
                    {String(timeRemaining.minutes).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-muted uppercase">Mins</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 text-center min-w-[60px]">
                  <p className="font-heading font-bold text-2xl text-orange-600">
                    {String(timeRemaining.seconds).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] text-muted uppercase">Secs</p>
                </div>
              </div>

              {/* Return Button */}
              <Link
                to={`/return/${order._id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition"
              >
                <FiRefreshCw /> Return / Exchange Request
              </Link>
            </div>
          )}

          {/* Return Status Display — agar already requested hai */}
          {returnStatusDisplay && (
            <div className={`${returnStatusDisplay.color} rounded-2xl p-4 mb-5`}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {returnStatusDisplay.text.split(" ")[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {returnStatusDisplay.text.slice(2)}
                  </p>
                  {order.returnInfo?.refundAmount > 0 && (
                    <p className="text-xs mt-0.5">
                      Refund Amount: ₹{order.returnInfo.refundAmount}
                    </p>
                  )}
                </div>
                <Link
                  to={`/returns/${order.returnInfo?.returnId}`}
                  className="text-xs font-semibold underline"
                >
                  View Details →
                </Link>
              </div>
            </div>
          )}

          {/* Return Window Closed — agar deadline khatam */}
          {order.returnDeadline &&
            new Date() > new Date(order.returnDeadline) &&
            (!order.returnStatus || order.returnStatus === "NONE") && (
              <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 mb-5 text-center">
                <p className="text-sm text-muted">
                  ❌ Return window (3 ghante) khatam ho gayi
                </p>
              </div>
            )}
        </>
      )}

      {/* 🗺️ Live Tracking Map — Only when OUT_FOR_DELIVERY */}
      {order.orderStatus === "OUT_FOR_DELIVERY" &&
        order.shippingAddress?.coordinates &&
        order.pickupAddress?.coordinates && (
          <LiveTrackingMap
            orderId={order._id}
            pickupCoords={{
              lat: order.pickupAddress.coordinates[1],
              lng: order.pickupAddress.coordinates[0],
            }}
            dropCoords={{
              lat: order.shippingAddress.coordinates[1],
              lng: order.shippingAddress.coordinates[0],
            }}
          />
        )}

      {/* Progress */}
      {order.orderStatus !== "CANCELLED" && (
        <div className="bg-white rounded-xl shadow-card p-5 mb-5">
          <h3 className="font-heading font-bold text-sm mb-4">Order Tracking</h3>
          <div className="flex justify-between items-start overflow-x-auto gap-2">
            {statusSteps.map((s, i) => (
              <div
                key={s}
                className="flex-1 flex flex-col items-center min-w-[70px]"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= currentStep
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-muted"
                  }`}
                >
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <p
                  className={`text-[10px] mt-2 text-center ${
                    i <= currentStep
                      ? "text-primary font-semibold"
                      : "text-muted"
                  }`}
                >
                  {s.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items + Address */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
              <FiPackage className="text-primary" /> Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <img
                    src={item.image}
                    className="w-16 h-16 rounded-lg object-cover"
                    alt=""
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted">{item.shopName}</p>
                    <p className="text-sm mt-1">
                      ₹{item.finalPrice} × {item.qty} ={" "}
                      <b className="text-primary">
                        ₹{item.finalPrice * item.qty}
                      </b>
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
              {order.shippingAddress.line1}, {order.shippingAddress.city} -{" "}
              {order.shippingAddress.pincode}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold mb-2 text-sm flex items-center gap-2">
              <FiTruck className="text-primary" /> Delivery Method
            </h3>
            <p className="text-sm font-medium">
              {order.deliveryType === "SELLER"
                ? "🏪 Seller Delivery"
                : "🚚 AsaliMart Delivery"}
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
                <span>
                  {order.deliveryCharge === 0
                    ? "FREE"
                    : `₹${order.deliveryCharge}`}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <FiTag className="text-xs" /> Coupon ({order.couponCode})
                  </span>
                  <span className="font-semibold">-₹{order.discount}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* 💳 Payment Section */}
          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold mb-2 text-sm">Payment</h3>
            <p className="text-sm">{order.paymentMode}</p>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted">Status:</span>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  actualPaymentStatus === "PAID"
                    ? "bg-green-100 text-green-700"
                    : actualPaymentStatus === "FAILED"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {actualPaymentStatus === "PAID" ? "✅ PAID" : actualPaymentStatus}
              </span>
            </div>

            {order.paymentDetails?.transactionId && (
              <p className="text-[10px] text-muted mt-2 font-mono break-all">
                Txn: {order.paymentDetails.transactionId}
              </p>
            )}

            {order.paymentDetails?.paidAt && (
              <p className="text-[10px] text-muted mt-1">
                Paid:{" "}
                {new Date(order.paymentDetails.paidAt).toLocaleString("en-IN")}
              </p>
            )}
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

      {/* ⭐ Rating Modal */}
      {showRatingModal && (
        <DeliveryRatingModal
          order={order}
          onClose={() => setShowRatingModal(false)}
          onSuccess={() => {
            setShowRatingModal(false);
            load();
          }}
        />
      )}
    </div>
  );
};

export default OrderDetails;