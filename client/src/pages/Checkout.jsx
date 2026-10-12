import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin, FiCreditCard, FiDollarSign, FiCheck,
  FiShoppingBag, FiTruck, FiTag, FiX, FiClock, FiAlertCircle,
  FiNavigation, FiLoader, FiSmartphone,
} from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import { useDeliveryInfo } from "../hooks/useDeliveryInfo";
import { getFullAddress } from "../hooks/useLocation";
import { createOrderApi } from "../services/orderService";
import { checkPincodeApi } from "../services/shopService";
import {
  validateCouponApi,
  fetchActiveCoupons,
} from "../services/couponService";
import AddressAutocomplete from "../components/common/AddressAutocomplete";
import api from "../services/api";

const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { location, detectLocation } = useLocation();
  const deliveryInfo = useDeliveryInfo();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState("COD");
  const [deliveryType, setDeliveryType] = useState("ASALIMART");

  const [pincodeError, setPincodeError] = useState("");
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeAvailable, setPincodeAvailable] = useState(null);

  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);

  const [settings, setSettings] = useState(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const [address, setAddress] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    line1: "",
    city: location?.name || "",
    state: "",
    pincode: "",
    coordinates: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/settings");
        setSettings(res.data.settings);
      } catch (err) {
        console.error("Settings load error:", err.message);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (location?.name && !address.coordinates) {
      setAddress((prev) => ({
        ...prev,
        city: prev.city || location.name,
      }));
    }
    // eslint-disable-next-line
  }, [location]);

  useEffect(() => {
    const autoFill = async () => {
      if (!location?.lat || !location?.lng) return;
      if (autoFilled) return;
      if (address.coordinates) return;

      try {
        setAutoFilling(true);
        const fullAddress = await getFullAddress(location.lat, location.lng);

        if (fullAddress) {
          setAddress((prev) => {
            if (prev.coordinates) return prev;
            return {
              ...prev,
              line1: prev.line1 || fullAddress.line1 || "",
              city: fullAddress.city || prev.city || location.name || "",
              pincode: prev.pincode || fullAddress.pincode || "",
            };
          });

          if (fullAddress.pincode && fullAddress.pincode.length === 6) {
            handlePincodeCheck(fullAddress.pincode);
          }
        }
        setAutoFilled(true);
      } catch (err) {
        console.error("Auto-fill failed:", err.message);
      } finally {
        setAutoFilling(false);
      }
    };

    autoFill();
    // eslint-disable-next-line
  }, [location]);

  const delivery = totalPrice > 500 ? 0 : 30;
  const platformFee = 10;
  const couponDiscount = coupon?.discount || 0;
  const finalTotal = totalPrice + delivery + platformFee - couponDiscount;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchActiveCoupons();
        setAvailableCoupons(data.coupons || []);
      } catch (err) {
        console.error("Coupons load error:", err.message);
      }
    };
    load();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="font-heading font-bold text-2xl mb-2">Please Login</h1>
        <p className="text-sm text-muted mb-4">
          You need to login to place an order
        </p>
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
        <p className="text-sm text-muted mb-4">
          Add products before checkout
        </p>
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-3 rounded-xl bg-primary text-white font-semibold"
        >
          Shop Now
        </button>
      </div>
    );
  }

  const handlePincodeCheck = async (pincode) => {
    setPincodeError("");
    setPincodeAvailable(null);

    if (!pincode || pincode.length !== 6) {
      setPincodeError("Valid 6-digit pincode daalein");
      setPincodeAvailable(false);
      return;
    }

    try {
      setCheckingPincode(true);
      const data = await checkPincodeApi(
        pincode,
        location?.lat,
        location?.lng
      );

      if (data.available) {
        setPincodeAvailable(true);
        setPincodeError("");
      } else {
        setPincodeAvailable(false);
        setPincodeError(data.message || "Ye pincode pe delivery available nahi hai");
      }
    } catch (err) {
      setPincodeAvailable(false);
      setPincodeError(err.response?.data?.message || "Pincode check failed");
    } finally {
      setCheckingPincode(false);
    }
  };

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

  // ============================================
  // 💳 RAZORPAY PAYMENT HANDLER
  // ============================================
  const handleRazorpayPayment = async () => {
    setError("");
    setRazorpayLoading(true);

    try {
      const { data } = await api.post("/orders/create-razorpay-order", {
        amount: finalTotal,
        receipt: `receipt_${Date.now()}`,
        notes: {
          customerName: address.name,
          customerPhone: address.phone,
          // userId aur userEmail backend automatically add karega
        },
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to create Razorpay order");
      }

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "AsaliMart",
        description: `Order Payment`,
        order_id: data.order.id,
        prefill: {
          name: address.name,
          contact: address.phone,
          email: user?.email || "",
        },
        theme: {
          color: "#16a34a",
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/orders/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              await createOrderAfterPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
              });
            } else {
              setError("Payment verification failed. Please contact support.");
              setRazorpayLoading(false);
            }
          } catch (err) {
            console.error("Verification error:", err);
            setError(
              err.response?.data?.message ||
                "Payment verification failed. Please contact support."
            );
            setRazorpayLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setRazorpayLoading(false);
            setError("Payment cancelled. Please try again.");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

      razorpayInstance.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        setError(`Payment failed: ${response.error.description}`);
        setRazorpayLoading(false);
      });
    } catch (err) {
      console.error("Razorpay error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to initialize payment"
      );
      setRazorpayLoading(false);
    }
  };

  // ============================================
  // 📦 CREATE ORDER (After Payment Success)
  // ============================================
  const createOrderAfterPayment = async (razorpayData = {}) => {
    setError("");

    const finalLat = address.coordinates?.lat || location?.lat;
    const finalLng = address.coordinates?.lng || location?.lng;

    if (!finalLat || !finalLng) {
      setError("Address ya location set karein.");
      setLoading(false);
      setRazorpayLoading(false);
      return;
    }

    if (pincodeAvailable !== true) {
      setError("Pincode verify nahi hua.");
      setLoading(false);
      setRazorpayLoading(false);
      return;
    }

    try {
      setLoading(true);

      const items = cart.map((item) => ({
        product: item._id || item.id,
        qty: item.qty,
      }));

      const res = await createOrderApi({
        items,
        shippingAddress: {
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          latitude: finalLat,
          longitude: finalLng,
        },
        paymentMode: payment,
        deliveryType,
        couponCode: coupon?.code || "",
        razorpay_payment_id: razorpayData.razorpay_payment_id || "",
        razorpay_order_id: razorpayData.razorpay_order_id || "",
      });

      clearCart();
      setLoading(false);
      setRazorpayLoading(false);
      navigate(`/orders/${res.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
      setLoading(false);
      setRazorpayLoading(false);
    }
  };

  const windowColors = {
    day: {
      bg: "bg-orange-50 border-orange-200",
      text: "text-orange-700",
      icon: "text-orange-500",
    },
    evening: {
      bg: "bg-purple-50 border-purple-200",
      text: "text-purple-700",
      icon: "text-purple-500",
    },
    night: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      icon: "text-blue-500",
    },
  };

  const colors = windowColors[deliveryInfo.window] || windowColors.night;

  const isAddressValid =
    address.name?.trim().length >= 2 &&
    address.phone?.trim().length >= 10 &&
    address.line1?.trim().length >= 5 &&
    address.city?.trim().length >= 2 &&
    address.pincode?.trim().length === 6 &&
    /^\d{6}$/.test(address.pincode);

  const canContinueToPayment =
    isAddressValid && pincodeAvailable === true && !checkingPincode;

  return (
    <div className="container-custom py-6">
      <h1 className="font-heading font-bold text-2xl mb-5">Checkout</h1>

      {/* 🚚 Delivery Info Banner */}
      <div className={`${colors.bg} border-2 rounded-2xl p-4 mb-5`}>
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${colors.icon}`}
          >
            <FiTruck className="text-xl" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className={`font-semibold text-sm ${colors.text}`}>
              {deliveryInfo.label} • {deliveryInfo.radiusText} tak
            </p>
            <p className="text-xs text-muted mt-0.5">{deliveryInfo.message}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <FiClock className={colors.icon} />
            <span>30-35 min delivery</span>
          </div>
        </div>
      </div>

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
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
          <FiAlertCircle /> {error}
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

              {location ? (
                <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0">
                      <FiMapPin />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-green-800 mb-1">
                        📍 Your Current Location
                      </p>
                      <p className="text-xs text-green-700">{location.name}</p>
                      <p className="text-[10px] text-green-600 mt-1">
                        GPS: {location.lat?.toFixed(4)},{" "}
                        {location.lng?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  {autoFilling && (
                    <p className="text-[10px] text-green-700 mt-3 flex items-center gap-1">
                      <FiLoader className="animate-spin" /> Auto-filling address...
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="mt-3 flex items-center gap-1.5 text-[10px] text-green-700 font-semibold hover:underline"
                  >
                    <FiNavigation /> Update Location
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500 text-white flex items-center justify-center shrink-0">
                      <FiAlertCircle />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-yellow-800 mb-1">
                        ⚠️ Location Set Nahi Hai
                      </p>
                      <p className="text-xs text-yellow-700">
                        Delivery ke liye location zaroori hai.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="mt-3 flex items-center gap-1.5 text-xs text-yellow-800 font-semibold bg-white px-3 py-1.5 rounded-lg hover:bg-yellow-100"
                  >
                    <FiNavigation /> Enable Location
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Full Name"
                  value={address.name}
                  onChange={(e) =>
                    setAddress({ ...address, name: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
                <input
                  placeholder="Phone"
                  value={address.phone}
                  onChange={(e) =>
                    setAddress({ ...address, phone: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block text-muted">
                  Address * (Search karein)
                </label>
                <AddressAutocomplete
                  value={address.line1}
                  onChange={(text) =>
                    setAddress((prev) => ({ ...prev, line1: text }))
                  }
                  onPlaceSelect={(place) => {
                    setAddress((prev) => ({
                      ...prev,
                      line1: place.line1 || prev.line1,
                      city: place.city || prev.city,
                      state: place.state || prev.state,
                      pincode: place.pincode || prev.pincode,
                      coordinates: { lat: place.lat, lng: place.lng },
                    }));

                    if (place.pincode && place.pincode.length === 6) {
                      handlePincodeCheck(place.pincode);
                    }
                  }}
                />

                {address.coordinates && (
                  <p className="text-[10px] text-accent mt-1 flex items-center gap-1">
                    ✅ Address verified
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted">
                    City
                  </label>
                  <input
                    value={address.city}
                    onChange={(e) =>
                      setAddress({ ...address, city: e.target.value })
                    }
                    placeholder="City"
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted">
                    Pincode *
                  </label>
                  <input
                    placeholder="400001"
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setAddress({ ...address, pincode: val });
                      if (val.length === 6) {
                        handlePincodeCheck(val);
                      } else {
                        setPincodeError("");
                        setPincodeAvailable(null);
                      }
                    }}
                    className={`w-full p-3 rounded-xl border outline-none text-sm transition ${
                      pincodeError
                        ? "border-danger bg-red-50"
                        : pincodeAvailable
                        ? "border-accent bg-green-50"
                        : "border-gray-200 focus:border-primary"
                    }`}
                  />

                  {checkingPincode && (
                    <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
                      <FiLoader className="animate-spin" /> Checking availability...
                    </p>
                  )}

                  {pincodeError && (
                    <p className="text-[10px] text-danger mt-1 flex items-center gap-1">
                      <FiAlertCircle /> {pincodeError}
                    </p>
                  )}

                  {pincodeAvailable && (
                    <p className="text-[10px] text-accent mt-1 flex items-center gap-1">
                      ✅ Delivery available
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  if (!isAddressValid) {
                    setError("Kripya saare address fields sahi bharein");
                    return;
                  }
                  if (pincodeAvailable !== true) {
                    setError("Pincode verify hone dein");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                disabled={!canContinueToPayment}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  canContinueToPayment
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {checkingPincode ? (
                  <span className="flex items-center justify-center gap-2">
                    <FiLoader className="animate-spin" /> Checking Pincode...
                  </span>
                ) : pincodeAvailable === false ? (
                  "Delivery Not Available"
                ) : (
                  "Continue to Payment"
                )}
              </button>
            </div>
          )}

          {/* Step 2 — Payment + Delivery */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-card p-5 space-y-3">
                <h3 className="font-heading font-bold text-lg flex items-center gap-2 mb-3">
                  <FiCreditCard className="text-primary" /> Payment Method
                </h3>
                {[
                  {
                    id: "COD",
                    label: "Cash on Delivery",
                    icon: FiDollarSign,
                    desc: "Pay when delivered",
                  },
                  {
                    id: "ONLINE",
                    label: "Online Payment (Razorpay)",
                    icon: FiSmartphone,
                    desc: "Pay via UPI/Card/Netbanking",
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPayment(p.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition text-left ${
                      payment === p.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                    }`}
                  >
                    <p.icon
                      className={`text-2xl ${
                        payment === p.id ? "text-primary" : "text-muted"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{p.label}</p>
                      <p className="text-xs text-muted">{p.desc}</p>
                    </div>
                    {payment === p.id && <FiCheck className="text-primary" />}
                  </button>
                ))}
              </div>

              {/* 💳 Razorpay Info Section — MINIMAL */}
              {payment === "ONLINE" && (
                <div className="bg-green-50 rounded-xl border-2 border-green-200 p-5">
                  <div className="text-center">
                    <p className="font-heading font-bold text-lg mb-1">
                      💳 Pay ₹{finalTotal} with Razorpay
                    </p>
                    <p className="text-xs text-muted">
                      UPI, Card, Netbanking, Wallets — sab supported
                    </p>
                  </div>
                </div>
              )}

              {/* 🚚 Delivery Type */}
              <div className="bg-white rounded-xl shadow-card p-5">
                <h3 className="font-heading font-bold text-lg flex items-center gap-2 mb-3">
                  <FiTruck className="text-primary" /> Delivery Method
                </h3>

                <div
                  className={`${colors.bg} border ${colors.bg} rounded-xl p-3 mb-4 flex items-center gap-2`}
                >
                  <FiClock className={colors.icon} />
                  <span className={`text-xs font-semibold ${colors.text}`}>
                    {deliveryInfo.label} — {deliveryInfo.radiusText} tak delivery
                  </span>
                </div>

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
                      {deliveryType === "SELLER" && (
                        <FiCheck className="text-primary" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">🏪 Seller Delivery</p>
                    <p className="text-xs text-muted mt-0.5">Direct from shop</p>
                    <p className="text-xs text-accent font-semibold mt-2">
                      Free · Fast
                    </p>
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
                      {deliveryType === "ASALIMART" && (
                        <FiCheck className="text-primary" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">🚚 AsaliMart Delivery</p>
                    <p className="text-xs text-muted mt-0.5">
                      Trained delivery partner
                    </p>
                    <p className="text-xs text-blue-600 font-semibold mt-2">
                      OTP verified · Trackable
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setError("");
                    setStep(3);
                  }}
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
              <h3 className="font-heading font-bold text-lg mb-4">
                Review Order
              </h3>

              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div
                    key={item.id || item._id}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <span className="font-semibold">
                      ₹
                      {(item.finalPrice ||
                        Math.round(
                          item.price - (item.price * item.discount) / 100
                        )) * item.qty}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-bg mb-4 text-xs">
                <p className="font-semibold text-dark mb-1">📍 Delivery Address</p>
                <p className="text-muted">
                  {address.name} • {address.phone}
                </p>
                <p className="text-muted">
                  {address.line1}, {address.city} - {address.pincode}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-bg mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Delivery Method</span>
                  <span className="font-semibold">
                    {deliveryType === "SELLER"
                      ? "🏪 Seller Delivery"
                      : "🚚 AsaliMart Delivery"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Payment</span>
                  <span className="font-semibold">
                    {payment === "COD"
                      ? "Cash on Delivery"
                      : "Online Payment (Razorpay)"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bg mb-4">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <FiTag className="text-primary" /> Have a coupon?
                </p>

                {coupon ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div>
                      <p className="font-bold text-sm text-green-700">
                        {coupon.code}
                      </p>
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
                        onChange={(e) =>
                          setCouponInput(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleApplyCoupon()
                        }
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

                    {availableCoupons.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dashed border-gray-300">
                        <p className="text-xs text-muted mb-2">
                          Available coupons:
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {availableCoupons.map((c) => (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => {
                                setCouponInput(c.code);
                                setCouponError("");
                              }}
                              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200 hover:border-primary transition text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-primary">
                                  {c.code}
                                </p>
                                <p className="text-[10px] text-muted truncate">
                                  {c.description}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-accent shrink-0 ml-2">
                                {c.discountType === "PERCENTAGE"
                                  ? `${c.discountValue}%`
                                  : `₹${c.discountValue}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t pt-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>₹{totalPrice.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Delivery</span>
                  <span>{delivery === 0 ? "FREE" : `₹${delivery}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Platform Fee</span>
                  <span>₹{platformFee}</span>
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

                {payment === "ONLINE" ? (
                  <button
                    onClick={handleRazorpayPayment}
                    disabled={razorpayLoading || loading || pincodeAvailable !== true}
                    className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {razorpayLoading ? (
                      <>
                        <FiLoader className="animate-spin" /> Opening Razorpay...
                      </>
                    ) : (
                      <>💳 Pay ₹{finalTotal} with Razorpay</>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => createOrderAfterPayment({})}
                    disabled={loading || pincodeAvailable !== true}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Placing order..." : "Place Order (COD)"}
                  </button>
                )}
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
              <div className="flex justify-between">
                <span className="text-muted">Platform Fee</span>
                <span>₹{platformFee}</span>
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

            <div className="mt-3 pt-3 border-t text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Delivery via</span>
                <span className="font-semibold">
                  {deliveryType === "SELLER" ? "🏪 Seller" : "🚚 AsaliMart"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Payment</span>
                <span className="font-semibold">
                  {payment === "COD" ? "COD" : "Razorpay"}
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