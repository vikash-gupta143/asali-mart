import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPackage, FiMapPin, FiDollarSign, FiRefreshCw,
  FiNavigation, FiAlertCircle,
} from "react-icons/fi";
import {
  fetchAvailableOrders,
  acceptDeliveryApi,
} from "../../services/deliveryService";
import { useLocation } from "../../context/LocationContext";

const Available = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const navigate = useNavigate();
  const { location } = useLocation();  // 🆕 Location import

  // 🆕 Load orders with location filter
  const load = async () => {
    try {
      setLoading(true);
      // 🆕 Pass location (lat, lng, pincode) if available
      const data = await fetchAvailableOrders(
        location?.lat,
        location?.lng,
        location?.pincode
      );
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Reload when location changes
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [location?.lat, location?.lng, location?.pincode]);

  // ============================================
  // 🚨 Layer 3 — Rider Warning on Accept
  // ============================================
  const handleAccept = async (orderId, distance) => {
    // Very far → block
    if (distance > 10) {
      alert("❌ Ye order 10 km se door hai. Accept nahi kar sakte.");
      return;
    }

    // Far (8-10 km) → warning
    if (distance >= 8 && distance <= 10) {
      const confirmMsg =
        `⚠️ WARNING: Ye order ${distance} km door hai.\n\n` +
        `Delivery me extra time lagega (45-60 min).\n\n` +
        `Kya aap confirm karte hain ki aap ye order deliver kar sakte hain?`;

      if (!window.confirm(confirmMsg)) return;
    }

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

  // 🎨 Distance badge color
  const getDistanceColor = (distance) => {
    if (distance > 10) return "bg-gray-100 text-gray-600";
    if (distance >= 8) return "bg-red-100 text-red-700";
    if (distance >= 5) return "bg-orange-100 text-orange-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl">Available Orders</h1>
          <p className="text-sm text-muted">
            {orders.length} orders waiting
            {location?.name && (
              <span className="text-xs text-primary ml-1">
                • 📍 {location.name}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl bg-white shadow-card hover:bg-bg"
        >
          <FiRefreshCw />
        </button>
      </div>

      {/* 🆕 Location warning banner */}
      {!location && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 flex items-center gap-2">
          <FiAlertCircle className="text-yellow-600 shrink-0" />
          <p className="text-xs text-yellow-800">
            📍 Location set nahi hai. Apne area ke orders dekhne ke liye location enable karein.
          </p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiPackage className="text-5xl text-muted mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-2">
            No orders available
          </h3>
          <p className="text-sm text-muted">
            {location
              ? "Aapke area me abhi koi order nahi hai. Thodi der baad check karein."
              : "Location set karein taaki aapko aapke area ke orders dikhein."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const distance = order.distance || 0;

            return (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-card p-4"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-sm">
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* 🚚 Distance badge */}
                    {order.distance !== undefined && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getDistanceColor(
                          distance
                        )}`}
                      >
                        📍 {distance} km
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      {order.orderStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* 🚨 Warning for far orders (8-10 km) */}
                {distance >= 8 && distance <= 10 && (
                  <div className="mb-3 p-3 rounded-xl bg-red-50 border-2 border-red-200">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="text-red-600 text-lg mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-700 mb-1">
                          Door Delivery — {distance} km
                        </p>
                        <p className="text-[10px] text-red-600 leading-relaxed">
                          Ye order door hai. Delivery me{" "}
                          <b>45-60 min</b> lag sakte hain. Confirm karein ki
                          aap deliver kar sakte hain.
                        </p>
                        <p className="text-[10px] text-red-700 font-semibold mt-1">
                          💰 Extra earning: ₹
                          {Math.round((order.deliveryEarnings || 24) + (distance - 5) * 5)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ❌ Block for > 10 km */}
                {distance > 10 && (
                  <div className="mb-3 p-3 rounded-xl bg-gray-100 border-2 border-gray-300">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="text-gray-600 text-lg mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-700 mb-1">
                          ❌ Ye order 10 km se door hai
                        </p>
                        <p className="text-[10px] text-gray-600">
                          Abhi ye order accept nahi kar sakte.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pickup + Drop Info */}
                <div className="space-y-3 mb-3 text-xs">
                  {/* 🏪 Pickup */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FiPackage />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark">Pickup</p>
                      <p className="text-muted">
                        {order.pickupAddress?.name ||
                          order.items?.[0]?.shopName ||
                          "Shop"}
                      </p>
                      {order.pickupAddress?.line1 && (
                        <p className="text-muted text-[10px]">
                          {order.pickupAddress.line1},{" "}
                          {order.pickupAddress.city}
                        </p>
                      )}
                      {order.pickupAddress?.coordinates?.[0] !== 0 && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${order.pickupAddress.coordinates[1]},${order.pickupAddress.coordinates[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-semibold text-[10px] inline-flex items-center gap-1 mt-1 hover:underline"
                        >
                          <FiNavigation /> Navigate to Pickup
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 📍 Drop */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <FiMapPin />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark">Deliver to</p>
                      <p className="text-muted">
                        {order.shippingAddress?.line1},{" "}
                        {order.shippingAddress?.city}
                      </p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${order.shippingAddress?.line1 || ""} ${order.shippingAddress?.city || ""} ${order.shippingAddress?.pincode || ""}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent font-semibold text-[10px] inline-flex items-center gap-1 mt-1 hover:underline"
                      >
                        <FiNavigation /> Navigate to Customer
                      </a>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted">Earning</p>
                    <p className="font-bold text-accent">
                      ₹{order.deliveryEarnings || 24}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAccept(order._id, distance)}
                    disabled={accepting === order._id || distance > 10}
                    className={`px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition ${
                      distance >= 8
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-primary hover:bg-primary-dark"
                    }`}
                  >
                    {accepting === order._id
                      ? "Accepting..."
                      : distance > 10
                      ? "❌ Too Far"
                      : distance >= 8
                      ? "⚠️ Accept (Far)"
                      : "Accept"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Available;