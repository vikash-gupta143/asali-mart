import { useState, useEffect } from "react";
import { FiPackage, FiMapPin, FiCheck, FiLock } from "react-icons/fi";
import {
  fetchMyDeliveries,
  markPickedUpApi,
  verifyDeliveryOTPApi,
} from "../../services/deliveryService";

const statusColors = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-yellow-100 text-yellow-700",
  PACKED: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const MyDeliveries = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpModal, setOtpModal] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pickingUp, setPickingUp] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchMyDeliveries();
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

  const handlePickup = async (orderId) => {
    try {
      setPickingUp(orderId);
      await markPickedUpApi(orderId);
      load();
    } catch (err) {
      alert("Failed");
    } finally {
      setPickingUp(null);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpInput.length !== 4) {
      setOtpError("4-digit OTP daalein");
      return;
    }
    try {
      setVerifying(true);
      setOtpError("");
      await verifyDeliveryOTPApi(otpModal._id, otpInput);
      setOtpModal(null);
      setOtpInput("");
      load();
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl">My Deliveries</h1>
        <p className="text-sm text-muted">{orders.length} total deliveries</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiPackage className="text-5xl text-muted mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-2">No deliveries yet</h3>
          <p className="text-sm text-muted">Accept orders from Available section</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-card p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-muted">{order.shippingAddress?.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.orderStatus]}`}>
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </div>

              <div className="space-y-2 mb-3 text-xs">
                <div className="flex items-start gap-2">
                  <FiPackage className="text-primary mt-0.5" />
                  <p className="text-muted">
                    Pickup: {order.items?.[0]?.shopName || "Shop"}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <FiMapPin className="text-accent mt-0.5" />
                  <p className="text-muted">
                    {order.shippingAddress?.line1}, {order.shippingAddress?.city}
                  </p>
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

                {order.orderStatus === "DELIVERED" ? (
                  <span className="text-xs text-accent font-semibold">✓ Delivered</span>
                ) : order.orderStatus === "PACKED" ? (
                  <button
                    onClick={() => handlePickup(order._id)}
                    disabled={pickingUp === order._id}
                    className="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-semibold"
                  >
                    {pickingUp === order._id ? "..." : "Mark Picked Up"}
                  </button>
                ) : order.orderStatus === "OUT_FOR_DELIVERY" ? (
                  <button
                    onClick={() => {
                      setOtpModal(order);
                      setOtpInput("");
                      setOtpError("");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold"
                  >
                    <FiLock /> Verify OTP
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTP Modal */}
      {otpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-card w-full max-w-sm p-6">
            <h3 className="font-heading font-bold text-lg text-center mb-1">
              🔐 Verify Delivery OTP
            </h3>
            <p className="text-xs text-muted text-center mb-5">
              Customer se OTP poochein aur yahan enter karein
            </p>

            {otpError && (
              <div className="mb-3 p-2 rounded-lg bg-red-50 text-red-700 text-xs text-center">
                ⚠️ {otpError}
              </div>
            )}

            <input
              type="text"
              maxLength={4}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
              placeholder="• • • •"
              autoFocus
              className="w-full text-center font-heading font-bold text-3xl tracking-[20px] p-4 rounded-xl border-2 border-gray-200 outline-none focus:border-primary mb-5"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setOtpModal(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={verifying || otpInput.length !== 4}
                className="flex-1 py-3 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Verify & Deliver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;