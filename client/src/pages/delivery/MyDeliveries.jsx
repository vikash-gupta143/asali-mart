import { useState, useEffect } from "react";
import {
  FiMapPin, FiPackage, FiCheck, FiX, FiDollarSign,
  FiSmartphone, FiNavigation, FiClock,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  fetchMyDeliveries,
  verifyDeliveryOTPApi,
  markPickedUpApi,
} from "../../services/deliveryService";

const MyDeliveries = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpModal, setOtpModal] = useState(null);
  const [otpStep, setOtpStep] = useState(1); // 1 = payment, 2 = OTP
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pickingUp, setPickingUp] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchMyDeliveries();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openOtpModal = (order) => {
    setOtpModal(order);
    setPaymentMethod(null);
    setOtp("");
    setOtpStep(1);
  };

  const closeOtpModal = () => {
    setOtpModal(null);
    setPaymentMethod(null);
    setOtp("");
    setOtpStep(1);
  };

  const handlePickup = async (orderId) => {
    try {
      setPickingUp(orderId);
      await markPickedUpApi(orderId);
      toast.success("Order picked up!");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setPickingUp(null);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      toast.error("4-digit OTP daalein");
      return;
    }
    if (!paymentMethod) {
      toast.error("Payment method select karein");
      return;
    }

    try {
      setVerifying(true);
      await verifyDeliveryOTPApi(otpModal._id, otp, paymentMethod);
      toast.success("✅ Order delivered! Wallet updated.");
      closeOtpModal();
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-muted">Loading...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl">🚚 My Deliveries</h1>
        <p className="text-sm text-muted">{orders.length} total deliveries</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiPackage className="text-5xl text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No deliveries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-card p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-sm">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.orderStatus === "DELIVERED"
                      ? "bg-green-100 text-green-700"
                      : order.orderStatus === "OUT_FOR_DELIVERY"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </div>

              {/* Address */}
              <div className="space-y-2 mb-3 text-xs">
                <div className="flex items-start gap-2">
                  <FiPackage className="text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Pickup</p>
                    <p className="text-muted">
                      {order.pickupAddress?.name || "Shop"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FiMapPin className="text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold">Deliver to</p>
                    <p className="text-muted">
                      {order.shippingAddress?.line1},{" "}
                      {order.shippingAddress?.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 mb-3 flex justify-between items-center">
                <span className="text-xs text-green-700">Your Earning</span>
                <span className="font-bold text-green-600">
                  ₹{order.deliveryEarnings || 24}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {order.orderStatus === "OUT_FOR_DELIVERY" &&
                  !order.pickedUpAt && (
                    <button
                      onClick={() => handlePickup(order._id)}
                      disabled={pickingUp === order._id}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm disabled:opacity-50"
                    >
                      {pickingUp === order._id
                        ? "Picking up..."
                        : "Mark Picked Up"}
                    </button>
                  )}

                {order.orderStatus === "OUT_FOR_DELIVERY" &&
                  order.pickedUpAt &&
                  !order.deliveryOTPVerified && (
                    <button
                      onClick={() => openOtpModal(order)}
                      className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm"
                    >
                      🔐 Enter OTP & Deliver
                    </button>
                  )}

                {order.orderStatus === "DELIVERED" && (
                  <div className="flex-1 text-center text-sm text-green-600 font-semibold py-2.5">
                    ✅ Delivered
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================ */}
      {/* OTP MODAL — 2 STEP */}
      {/* ============================================ */}
      {otpModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6">
            {/* Step 1 — Payment Method */}
            {otpStep === 1 && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading font-bold text-lg">
                    💳 Payment Method
                  </h3>
                  <button
                    onClick={closeOtpModal}
                    className="p-1.5 rounded-lg hover:bg-bg"
                  >
                    <FiX />
                  </button>
                </div>

                <p className="text-xs text-muted mb-4">
                  Order #{otpModal.orderNumber} • Amount: ₹{otpModal.totalAmount}
                </p>

                <p className="text-sm font-medium mb-3">
                  Customer ne payment kaise kiya?
                </p>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { id: "CASH", emoji: "💵", label: "Cash" },
                    { id: "UPI", emoji: "📱", label: "UPI" },
                    { id: "ONLINE", emoji: "🌐", label: "Online Paid" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        paymentMethod === m.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200"
                      }`}
                    >
                      <p className="text-2xl mb-1">{m.emoji}</p>
                      <p className="text-xs font-semibold">{m.label}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setOtpStep(2)}
                  disabled={!paymentMethod}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
                >
                  Continue
                </button>
              </>
            )}

            {/* Step 2 — OTP */}
            {otpStep === 2 && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading font-bold text-lg">
                    🔐 Enter OTP
                  </h3>
                  <button
                    onClick={closeOtpModal}
                    className="p-1.5 rounded-lg hover:bg-bg"
                  >
                    <FiX />
                  </button>
                </div>

                {/* Payment summary */}
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 mb-4 text-xs">
                  <p className="text-green-700">
                    Payment:{" "}
                    <b>
                      {paymentMethod === "CASH" && "💵 Cash"}
                      {paymentMethod === "UPI" && "📱 UPI"}
                      {paymentMethod === "ONLINE" && "🌐 Online Paid"}
                    </b>
                  </p>
                  <p className="text-green-600 mt-1">
                    Amount: ₹{otpModal.totalAmount}
                  </p>
                </div>

                <p className="text-xs text-muted mb-2">
                  Customer se OTP lein aur yahan daalein
                </p>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  maxLength={4}
                  placeholder="1234"
                  autoFocus
                  className="w-full p-4 text-center text-2xl font-bold tracking-widest rounded-xl border border-gray-200 outline-none focus:border-primary mb-4"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setOtpStep(1)}
                    className="px-4 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyOTP}
                    disabled={verifying || otp.length !== 4}
                    className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm disabled:opacity-50"
                  >
                    {verifying ? "Verifying..." : "Confirm Delivery"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;