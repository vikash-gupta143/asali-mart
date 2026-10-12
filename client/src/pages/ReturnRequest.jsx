import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiArrowLeft, FiUpload, FiX, FiAlertCircle, FiCheck,
  FiPackage, FiDollarSign, FiRefreshCw, FiImage,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { fetchOrderById } from "../services/orderService";
import api from "../services/api";

const RETURN_REASONS = [
  { id: "SIZE_ISSUE", label: "Size sahi nahi hai", icon: "📏" },
  { id: "DAMAGED", label: "Product damaged hai", icon: "💔" },
  { id: "WRONG_PRODUCT", label: "Galat product aaya", icon: "❌" },
  { id: "QUALITY_ISSUE", label: "Quality issue hai", icon: "⚠️" },
  { id: "NOT_AS_DESCRIBED", label: "Description se alag hai", icon: "📝" },
  { id: "OTHER", label: "Aur kuch", icon: "💬" },
];

const ReturnRequest = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [selectedItem, setSelectedItem] = useState(null);
  const [reason, setReason] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [returnType, setReturnType] = useState("REFUND");

  // Load order
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOrderById(orderId);
        setOrder(data.order);

        // Default first item
        if (data.order?.items?.length > 0) {
          setSelectedItem(data.order.items[0]._id || data.order.items[0].product);
        }
      } catch (err) {
        console.error(err);
        setError("Order load nahi ho paya");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  // Check if return window is open
  const isWindowOpen = () => {
    if (!order?.returnDeadline) return false;
    return new Date() < new Date(order.returnDeadline);
  };

  // Time remaining
  const getTimeRemaining = () => {
    if (!order?.returnDeadline) return null;
    const now = new Date();
    const deadline = new Date(order.returnDeadline);
    const diff = deadline - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  };

  const timeRemaining = getTimeRemaining();

  // Upload image to Cloudinary (via backend)
  const handleImageUpload = async (file) => {
    if (images.length >= 3) {
      toast.error("Maximum 3 photos upload kar sakte hain");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImages([...images, res.data.url]);
      toast.success("Photo upload ho gayi");
    } catch (err) {
      console.error(err);
      toast.error("Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Submit return request
  const handleSubmit = async () => {
    setError("");

    if (!selectedItem) {
      setError("Kripya ek item select karein");
      return;
    }

    if (!reason) {
      setError("Kripya return ka reason select karein");
      return;
    }

    if (reason === "OTHER" && !reasonText.trim()) {
      setError("Kripya reason likhein");
      return;
    }

    if (images.length === 0) {
      setError("Kripya kam se kam 1 photo upload karein");
      return;
    }

    try {
      setSubmitting(true);

      const res = await api.post("/returns", {
        orderId: order._id,
        itemId: selectedItem,
        reason,
        reasonText: reasonText.trim(),
        images,
        type: returnType,
      });

      toast.success("Return request successfully create ho gayi!");
      navigate(`/returns/${res.data.return._id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Return request failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted mt-3">Loading...</p>
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <div className="container-custom py-20 text-center">
        <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-3" />
        <h1 className="font-heading font-bold text-xl mb-2">Order not found</h1>
        <Link
          to="/orders"
          className="inline-block px-6 py-2 rounded-xl bg-primary text-white font-semibold mt-3"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  // Return window closed
  if (!isWindowOpen()) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-card p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-3xl" />
          </div>
          <h1 className="font-heading font-bold text-xl mb-2">
            Return Window Closed
          </h1>
          <p className="text-sm text-muted mb-5">
            Order #{order.orderNumber} ka return window (3 ghante) khatam ho gaya hai.
          </p>
          <Link
            to={`/orders/${order._id}`}
            className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold"
          >
            Back to Order
          </Link>
        </div>
      </div>
    );
  }

  // Already has return request
  if (order.returnStatus && order.returnStatus !== "NONE") {
    return (
      <div className="container-custom py-20 text-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-card p-8">
          <div className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-4">
            <FiRefreshCw className="text-3xl" />
          </div>
          <h1 className="font-heading font-bold text-xl mb-2">
            Return Already Requested
          </h1>
          <p className="text-sm text-muted mb-5">
            Is order ke liye already return request hai.
          </p>
          <Link
            to={`/returns/${order.returnInfo?.returnId}`}
            className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold"
          >
            View Return
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-6 max-w-4xl mx-auto">
      <Link
        to={`/orders/${order._id}`}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-4"
      >
        <FiArrowLeft /> Back to Order
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <h1 className="font-heading font-bold text-2xl mb-1">
          Return Request
        </h1>
        <p className="text-sm text-muted">
          Order #{order.orderNumber} • Placed on{" "}
          {new Date(order.createdAt).toLocaleString("en-IN")}
        </p>
      </div>

      {/* Timer */}
      {timeRemaining && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xl">
            ⏰
          </div>
          <div>
            <p className="font-bold text-orange-800 text-sm">
              Return Window: {timeRemaining.hours}h {timeRemaining.minutes}m left
            </p>
            <p className="text-xs text-orange-700">
              Isse pehle return request daal dein
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Step 1: Select Item */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <h2 className="font-heading font-bold text-lg mb-3">
          1. Item Select Karein
        </h2>
        <div className="space-y-2">
          {order.items.map((item, i) => {
            const itemId = item._id || item.product;
            const isSelected = selectedItem === itemId;

            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedItem(itemId)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted">
                    ₹{item.finalPrice} × {item.qty} = ₹
                    {item.finalPrice * item.qty}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                    <FiCheck />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Reason */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <h2 className="font-heading font-bold text-lg mb-3">
          2. Return Ka Reason
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RETURN_REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReason(r.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                reason === r.id
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-xl">{r.icon}</span>
              <span className="text-sm font-medium">{r.label}</span>
            </button>
          ))}
        </div>

        {reason === "OTHER" && (
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Kripya detail likhein..."
            rows={3}
            className="w-full mt-3 p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm resize-none"
          />
        )}
      </div>

      {/* Step 3: Photos */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <h2 className="font-heading font-bold text-lg mb-3">
          3. Photos Upload Karein (Max 3)
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Return ${i + 1}`}
                className="w-full h-24 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
              >
                <FiX />
              </button>
            </div>
          ))}

          {images.length < 3 && (
            <label
              className={`flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer transition ${
                uploading
                  ? "border-gray-300 bg-gray-50"
                  : "border-gray-300 hover:border-primary hover:bg-primary/5"
              }`}
            >
              {uploading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiUpload className="text-2xl text-muted mb-1" />
                  <span className="text-[10px] text-muted">Add Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleImageUpload(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          )}
        </div>

        <p className="text-xs text-muted mt-3">
          💡 Tip: Product ki clear photo lein — damage, size, ya issue dikhe
        </p>
      </div>

      {/* Step 4: Refund Type */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <h2 className="font-heading font-bold text-lg mb-3">
          4. Refund Ya Exchange?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setReturnType("REFUND")}
            className={`p-4 rounded-xl border-2 transition text-center ${
              returnType === "REFUND"
                ? "border-primary bg-primary/5"
                : "border-gray-200"
            }`}
          >
            <FiDollarSign
              className={`text-2xl mx-auto mb-2 ${
                returnType === "REFUND" ? "text-primary" : "text-muted"
              }`}
            />
            <p className="font-semibold text-sm">Refund</p>
            <p className="text-[10px] text-muted mt-1">
              Paisa wapas milega
            </p>
          </button>

          <button
            type="button"
            onClick={() => setReturnType("EXCHANGE")}
            className={`p-4 rounded-xl border-2 transition text-center ${
              returnType === "EXCHANGE"
                ? "border-primary bg-primary/5"
                : "border-gray-200"
            }`}
          >
            <FiRefreshCw
              className={`text-2xl mx-auto mb-2 ${
                returnType === "EXCHANGE" ? "text-primary" : "text-muted"
              }`}
            />
            <p className="font-semibold text-sm">Exchange</p>
            <p className="text-[10px] text-muted mt-1">
              Naya product milega
            </p>
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || uploading}
        className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Submitting...
          </>
        ) : (
          <>🔄 Submit Return Request</>
        )}
      </button>

      <p className="text-xs text-muted text-center mt-3">
        Submit karne ke baad seller 15 minute mein approve/reject karega
      </p>
    </div>
  );
};

export default ReturnRequest;