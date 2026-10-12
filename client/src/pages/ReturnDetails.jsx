import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiPackage, FiDollarSign, FiRefreshCw,
  FiClock, FiCheck, FiX, FiAlertCircle, FiTruck,
  FiUser, FiMapPin, FiCalendar,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";
import { useSocket } from "../context/SocketContext";

const STATUS_STEPS = [
  { id: "REQUESTED", label: "Requested", icon: FiClock },
  { id: "APPROVED", label: "Approved", icon: FiCheck },
  { id: "PICKUP_SCHEDULED", label: "Pickup Scheduled", icon: FiTruck },
  { id: "PICKED_UP", label: "Picked Up", icon: FiPackage },
  { id: "RECEIVED", label: "Received", icon: FiCheck },
  { id: "COMPLETED", label: "Refund Done", icon: FiDollarSign },
];

const ReturnDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await api.get(`/returns/${id}`);
      setReturnData(res.data.return);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Return load nahi ho paya");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // 🔔 Real-time updates
  useEffect(() => {
    if (!socket || !returnData) return;

    const handleUpdate = (data) => {
      if (data.returnId === id) {
        console.log("🔔 Return update:", data);
        toast.success(data.message, { duration: 5000 });
        load();
      }
    };

    socket.on("return:approved", handleUpdate);
    socket.on("return:rejected", handleUpdate);
    socket.on("return:completed", handleUpdate);

    return () => {
      socket.off("return:approved", handleUpdate);
      socket.off("return:rejected", handleUpdate);
      socket.off("return:completed", handleUpdate);
    };
  }, [socket, id, returnData]);

  if (loading) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted mt-3">Loading...</p>
      </div>
    );
  }

  if (error || !returnData) {
    return (
      <div className="container-custom py-20 text-center">
        <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-3" />
        <h1 className="font-heading font-bold text-xl mb-2">
          {error || "Return not found"}
        </h1>
        <Link
          to="/orders"
          className="inline-block px-6 py-2 rounded-xl bg-primary text-white font-semibold mt-3"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  // Status color
  const statusColors = {
    REQUESTED: "bg-yellow-100 text-yellow-700 border-yellow-300",
    APPROVED: "bg-blue-100 text-blue-700 border-blue-300",
    REJECTED: "bg-red-100 text-red-700 border-red-300",
    PICKUP_SCHEDULED: "bg-indigo-100 text-indigo-700 border-indigo-300",
    PICKED_UP: "bg-purple-100 text-purple-700 border-purple-300",
    RECEIVED: "bg-cyan-100 text-cyan-700 border-cyan-300",
    REFUND_INITIATED: "bg-orange-100 text-orange-700 border-orange-300",
    COMPLETED: "bg-green-100 text-green-700 border-green-300",
    DISPUTED: "bg-red-100 text-red-700 border-red-300",
  };

  const statusColor = statusColors[returnData.status] || "bg-gray-100 text-gray-700 border-gray-300";

  // Current step index
  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.id === returnData.status
  );

  // Reason text
  const REASON_LABELS = {
    SIZE_ISSUE: "Size sahi nahi hai",
    DAMAGED: "Product damaged hai",
    WRONG_PRODUCT: "Galat product aaya",
    QUALITY_ISSUE: "Quality issue hai",
    NOT_AS_DESCRIBED: "Description se alag hai",
    OTHER: "Aur kuch",
  };

  return (
    <div className="container-custom py-6 max-w-4xl mx-auto">
      <Link
        to={`/orders/${returnData.order?._id}`}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-4"
      >
        <FiArrowLeft /> Back to Order
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl mb-1">
              Return #{returnData.returnNumber || returnData._id.slice(-6).toUpperCase()}
            </h1>
            <p className="text-xs text-muted">
              Order #{returnData.order?.orderNumber} • Requested on{" "}
              {new Date(returnData.requestedAt).toLocaleString("en-IN")}
            </p>
          </div>

          <span
            className={`px-4 py-2 rounded-full text-xs font-bold border-2 ${statusColor}`}
          >
            {returnData.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Rejection Alert */}
      {returnData.status === "REJECTED" && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <FiX className="text-red-500 text-xl shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 text-sm">
                Return Rejected
              </p>
              <p className="text-xs text-red-700 mt-1">
                Reason: {returnData.rejectionReason || "No reason provided"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      {returnData.status !== "REJECTED" && (
        <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
          <h2 className="font-heading font-bold text-lg mb-5">
            Return Progress
          </h2>

          <div className="space-y-4">
            {STATUS_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;

              return (
                <div key={step.id} className="flex items-start gap-4">
                  {/* Icon + Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                        isCompleted
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-400"
                      } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                    >
                      <Icon className="text-sm" />
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 ${
                          i < currentStepIndex ? "bg-primary" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 pt-2">
                    <p
                      className={`font-semibold text-sm ${
                        isCompleted ? "text-dark" : "text-muted"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-primary mt-0.5">
                        Current Status
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Item Details */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
          <FiPackage className="text-primary" /> Item
        </h2>
        <div className="flex gap-3">
          <img
            src={returnData.item?.image}
            alt={returnData.item?.name}
            className="w-20 h-20 rounded-xl object-cover"
          />
          <div className="flex-1">
            <p className="font-semibold text-sm">{returnData.item?.name}</p>
            <p className="text-xs text-muted mt-1">
              Qty: {returnData.item?.qty}
            </p>
            <p className="text-sm font-bold text-primary mt-1">
              ₹{returnData.item?.finalPrice * returnData.item?.qty}
            </p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <h2 className="font-heading font-bold text-lg mb-3">
          Return Reason
        </h2>
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
          <p className="text-sm font-semibold text-orange-800">
            {REASON_LABELS[returnData.reason] || returnData.reason}
          </p>
          {returnData.reasonText && (
            <p className="text-xs text-orange-700 mt-1">
              "{returnData.reasonText}"
            </p>
          )}
        </div>

        {/* Photos */}
        {returnData.images && returnData.images.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted mb-2">
              Uploaded Photos:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {returnData.images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Proof ${i + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Refund Info */}
      <div className="bg-white rounded-2xl shadow-card p-5 mb-5">
        <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
          <FiDollarSign className="text-primary" /> Refund Details
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Refund Type</span>
            <span className="font-semibold">
              {returnData.type === "REFUND" ? "💰 Refund" : "🔄 Exchange"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Refund Amount</span>
            <span className="font-bold text-primary">
              ₹{returnData.refundAmount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Refund Method</span>
            <span className="font-semibold">
              {returnData.refundMethod === "RAZORPAY"
                ? "💳 Razorpay"
                : returnData.refundMethod === "WALLET"
                ? "👛 Wallet"
                : "💵 Cash"}
            </span>
          </div>
          {returnData.razorpayRefundId && (
            <div className="flex justify-between">
              <span className="text-muted">Refund ID</span>
              <span className="font-mono text-xs">
                {returnData.razorpayRefundId}
              </span>
            </div>
          )}
          {returnData.completedAt && (
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted">Completed On</span>
              <span className="font-semibold text-green-600">
                {new Date(returnData.completedAt).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        {/* Refund Complete Message */}
        {returnData.status === "COMPLETED" && (
          <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200">
            <p className="text-xs text-green-700 text-center">
              🎉 Refund successfully process ho gaya!{" "}
              {returnData.refundMethod === "RAZORPAY" &&
                "Amount 2-3 working days me aapke bank account me aayega."}
            </p>
          </div>
        )}
      </div>

      {/* Pickup OTP (if applicable) */}
      {returnData.status === "PICKUP_SCHEDULED" &&
        returnData.pickupOTP &&
        !returnData.pickupOTPVerified && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-dashed border-indigo-400 rounded-2xl p-6 mb-5 text-center">
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-3">
              🔐 Pickup OTP
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {returnData.pickupOTP.split("").map((digit, i) => (
                <div
                  key={i}
                  className="w-12 h-14 bg-white rounded-xl shadow flex items-center justify-center border-2 border-indigo-200"
                >
                  <span className="font-heading font-bold text-2xl text-indigo-600">
                    {digit}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-indigo-700">
              Delivery boy ko ye OTP batayein product pickup ke waqt
            </p>
          </div>
        )}

      {/* Pickup Partner */}
      {returnData.pickupPartner && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
            🚚 Pickup Partner
          </p>
          <p className="font-semibold text-sm">
            {returnData.pickupPartner.name}
          </p>
          <p className="text-xs text-muted">
            📞 {returnData.pickupPartner.phone}
          </p>
        </div>
      )}

      {/* Back Button */}
      <Link
        to="/orders"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
      >
        <FiArrowLeft /> Back to My Orders
      </Link>
    </div>
  );
};

export default ReturnDetails;