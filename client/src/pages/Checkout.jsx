import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin, FiCreditCard, FiDollarSign, FiCheck,
  FiShoppingBag, FiTruck, FiTag, FiX,
} from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrderApi } from "../services/orderService";
import { validateCouponApi } from "../services/couponService";

const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState("COD");
  const [deliveryType, setDeliveryType] = useState("ASALIMART");

  // 🎟️ Coupon states
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [address, setAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    line1: "",
    city: "",
    pincode: "",
  });

  const delivery = totalPrice > 500 ? 0 : 30;
  const couponDiscount = coupon?.discount || 0;
  const finalTotal = totalPrice + delivery - couponDiscount;

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="font-heading font-bold text-2xl mb-2">Please Login</h1>
        <p className="text-sm text-muted mb-4">You need to login to place an order</p>
        <button
          onClick={() => navigate("/login")}
          className="px-6 py-3 rounded-xl bg-primary text-white font-semibold"
        >
          Login
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="font-heading font-bold text-2xl mb-2">Cart is empty</h1>
        <p className="text-sm text-muted mb-4">Add products before checkout</p>
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-3 rounded-xl bg-primary text-white font-semibold"
        >
          Shop Now
        </button>
      </div>
    );
  }

  // 🎟️ Apply coupon
  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponInput.trim()) return;

    try {
      setCouponLoading(true);
      const data = await validateCouponApi(couponInput.trim(), totalPrice);
      setCoupon(data.coupon);
      setCouponInput("");
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponError("");
  };

  const handlePlaceOrder = async () => {
    setError("");
    try {
      setLoading(true);
      const items = cart.map((item) => ({
        product: item._id || item.id,
        qty: item.qty,
      }));

      const res = await createOrderApi({
        items,
        shippingAddress: address,
        paymentMode: payment,
        deliveryType,
        couponCode: coupon?.code || "",
      });

      clearCart();
      navigate(`/orders/${res.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-6">
      <h1 className="font-heading font-bold text-2xl mb-5">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-6">
        {["Address", "Payment", "Review"].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1
                  ? "bg-accent text-white"
                  : step === i + 1
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-muted"
              }`}
            >
              {step > i + 1 ? <FiCheck /> : i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                step >= i + 1 ? "text-dark" : "text-muted"
              }`}
            >
              {s}
            </span>
            {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 1 — Address */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-card p-5 space-y-4">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                <FiMapPin className="text-primary" /> Delivery Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Full Name"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
                <input
                  placeholder="Phone"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
              <input
                placeholder="Address Line"
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
                <input
                  placeholder="Pincode"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
              <button
                onClick={() => {
                  if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) {
                    setError("Please fill all address fields");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2 — Payment + Delivery */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-card p-5 space-y-3">
                <h3 className="font-heading font-bold text-lg flex items-center gap-2 mb-3">
                  <FiCreditCard className="text-primary" /> Payment Method
                </h3>
                {[
                  { id: "COD", label: "Cash on Delivery", icon: FiDollarSign, desc: "Pay when delivered" },
                  { id: "ONLINE", label: "Online Payment", icon: FiCreditCard, desc: "UPI, Card, Netbanking" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPayment(p.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition text-left ${
                      payment === p.id ? "border-primary bg-primary/5" : "border-gray-200"
                    }`}
                  >
                    <p.icon className={`text-2xl ${payment === p.id ? "text-primary" : "text-muted"}`} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{p.label}</p>
                      <p className="text-xs text-muted">{p.desc}</p>
                    </div>
                    {payment === p.id && <FiCheck className="text-primary" />}
                  </button>
                ))}
              </div>

              {/* 🚚 Delivery Type */}
              <div className="bg-white rounded-xl shadow-card p-5">
                <h3 className="font-heading font-bold text-lg flex items-center gap-2 mb-3">
                  <FiTruck className="text-primary" /> Delivery Method
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("SELLER")}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      deliveryType === "SELLER"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        <FiShoppingBag />
                      </div>
                      {deliveryType === "SELLER" && <FiCheck className="text-primary" />}
                    </div>
                    <p className="font-semibold text-sm">🏪 Seller Delivery</p>
                    <p className="text-xs text-muted mt-0.5">Direct from shop</p>
                    <p className="text-xs text-accent font-semibold mt-2">Free · Fast</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType("ASALIMART")}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      deliveryType === "ASALIMART"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FiTruck />
                      </div>
                      {deliveryType === "ASALIMART" && <FiCheck className="text-primary" />}
                    </div>
                    <p className="font-semibold text-sm">🚚 AsaliMart Delivery</p>
                    <p className="text-xs text-muted mt-0.5">Trained delivery partner</p>
                    <p className="text-xs text-blue-600 font-semibold mt-2">
                      OTP verified · Trackable
                    </p>
                  </button>
                </div>

                <p className="text-xs text-muted mt-3 leading-relaxed">
                  {deliveryType === "SELLER"
                    ? "📦 Product seller khud deliver karega. Agar seller busy ho, to AsaliMart automatically deliver karega."
                    : "🚚 AsaliMart ka trained delivery partner aapka order deliver karega. OTP verification ke saath secure delivery."}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-card p-5">
              <h3 className="font-heading font-bold text-lg mb-4">Review Order</h3>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.id || item._id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.qty}</span>
                    <span className="font-semibold">
                      ₹{(item.finalPrice || Math.round(item.price - (item.price * item.discount) / 100)) * item.qty}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery + Payment Info */}
              <div className="p-3 rounded-xl bg-bg mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Delivery Method</span>
                  <span className="font-semibold">
                    {deliveryType === "SELLER" ? "🏪 Seller Delivery" : "🚚 AsaliMart Delivery"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Payment</span>
                  <span className="font-semibold">
                    {payment === "COD" ? "Cash on Delivery" : "Online Payment"}
                  </span>
                </div>
              </div>

              {/* 🎟️ Coupon Section */}
              <div className="p-4 rounded-xl bg-bg mb-4">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FiTag className="text-primary" /> Have a coupon?
                </p>

                {coupon ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div>
                      <p className="font-bold text-sm text-green-700">{coupon.code}</p>
                      <p className="text-xs text-green-600">
                        Saving ₹{coupon.discount} — {coupon.description}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-2 rounded-lg bg-white text-danger hover:bg-red-50"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        className="flex-1 p-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-danger mt-2">⚠️ {couponError}</p>
                    )}
                  </>
                )}
              </div>

              {/* Price Summary */}
              <div className="border-t pt-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>₹{totalPrice.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Delivery</span>
                  <span>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span className="font-semibold">-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t">
                  <span>Total</span>
                  <span className="text-primary">₹{finalTotal}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-60"
                >
                  {loading ? "Placing order..." : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-card p-5 sticky top-32">
            <h3 className="font-heading font-bold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-muted">Items ({cart.length})</span>
                <span>₹{totalPrice.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({coupon.code})</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">₹{finalTotal}</span>
            </div>

            <div className="mt-3 pt-3 border-t text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Delivery via</span>
                <span className="font-semibold">
                  {deliveryType === "SELLER" ? "🏪 Seller" : "🚚 AsaliMart"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;