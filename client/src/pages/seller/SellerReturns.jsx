import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiPackage, FiCheck, FiX, FiTruck, FiClock,
  FiAlertCircle, FiEye, FiDollarSign, FiRefreshCw,
  FiUser, FiMapPin, FiCalendar,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";

const STATUS_FILTERS = [
  { id: "ALL", label: "All", color: "bg-gray-100" },
  { id: "REQUESTED", label: "New Requests", color: "bg-yellow-100" },
  { id: "APPROVED", label: "Approved", color: "bg-blue-100" },
  { id: "PICKUP_SCHEDULED", label: "Pickup Scheduled", color: "bg-indigo-100" },
  { id: "PICKED_UP", label: "Picked Up", color: "bg-purple-100" },
  { id: "RECEIVED", label: "Received", color: "bg-cyan-100" },
  { id: "COMPLETED", label: "Completed", color: "bg-green-100" },
  { id: "REJECTED", label: "Rejected", color: "bg-red-100" },
];

const REASON_LABELS = {
  SIZE_ISSUE: "📏 Size issue",
  DAMAGED: "💔 Damaged",
  WRONG_PRODUCT: "❌ Wrong product",
  QUALITY_ISSUE: "⚠️ Quality issue",
  NOT_AS_DESCRIBED: "📝 Not as described",
  OTHER: "💬 Other",
};

const SellerReturns = () => {
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const socket = useSocket();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/returns/seller/returns?status=${filter}`);
      setReturns(res.data.returns);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
      toast.error("Returns load nahi ho paye");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  // 🔔 Real-time new return notification
  useEffect(() => {
    if (!socket) return;

    const handleNew = (data) => {
      console.log("🔔 New return:", data);
      toast.success(`🔄 New return request! Order #${data.orderNumber}`, {
        duration: 5000,
      });
      load();
    };

    socket.on("return:new", handleNew);
    return () => socket.off("return:new", handleNew);
  }, [socket]);

  // Approve return
  const handleApprove = async (returnId) => {
    if (!window.confirm("Kya aap yeh return approve karna chahte hain?")) return;

    try {
      setActionLoading(true);
      await api.put(`/returns/${returnId}/approve`);
      toast.success("✅ Return approve ho gaya!");
      setSelectedReturn(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approve failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject return
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason likhein");
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/returns/${selectedReturn._id}/reject`, {
        rejectionReason: rejectReason,
      });
      toast.success("Return reject ho gaya");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedReturn(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reject failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Schedule pickup (auto-assign, admin will handle)
  const handleSchedulePickup = async (returnId) => {
    try {
      setActionLoading(true);
      await api.put(`/returns/${returnId}/schedule-pickup`, {});
      toast.success("🚚 Pickup schedule ho gaya!");
      setSelectedReturn(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Pickup schedule failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Mark received
  const handleMarkReceived = async (returnId) => {
    if (!window.confirm("Product mil gaya? Confirm karein.")) return;

    try {
      setActionLoading(true);
      await api.put(`/returns/${returnId}/received`);
      toast.success("📥 Return received mark ho gaya!");
      setSelectedReturn(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Mark received failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Process refund
  const handleProcessRefund = async (returnId) => {
    if (
      !window.confirm(
        "Refund process karna chahte hain? Paisa customer ko chala jayega."
      )
    )
      return;

    try {
      setActionLoading(true);
      await api.put(`/returns/${returnId}/refund`);
      toast.success("💸 Refund process ho gaya!");
      setSelectedReturn(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Refund failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-custom py-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-heading font-bold text-2xl">
            🔄 Return Requests
          </h1>
          <p className="text-sm text-muted mt-1">
            Customer returns manage karein
          </p>
        </div>

        {stats?.totalPending > 0 && (
          <div className="px-4 py-2 rounded-xl bg-yellow-100 border-2 border-yellow-300">
            <p className="text-xs font-bold text-yellow-800">
              ⚠️ {stats.totalPending} new request
              {stats.totalPending > 1 ? "s" : ""} pending
            </p>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filter === f.id
                ? "bg-primary text-white shadow-md"
                : `${f.color} text-dark hover:opacity-80`
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Returns List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted mt-3">Loading...</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-10 text-center">
          <FiRefreshCw className="text-4xl text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Koi return request nahi hai</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-primary"
            >
              <div className="flex items-start gap-4 flex-wrap">
                {/* Item Image */}
                <img
                  src={r.item?.image}
                  alt={r.item?.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />

                {/* Details */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-sm">
                      Order #{r.order?.orderNumber}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === "REQUESTED"
                          ? "bg-yellow-100 text-yellow-700"
                          : r.status === "APPROVED"
                          ? "bg-blue-100 text-blue-700"
                          : r.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : r.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-xs text-muted">{r.item?.name}</p>
                  <p className="text-xs text-muted mt-1">
                    👤 {r.user?.name} • 📞 {r.user?.phone}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {REASON_LABELS[r.reason] || r.reason}
                    {r.reasonText && ` — "${r.reasonText}"`}
                  </p>
                  <p className="text-xs text-primary font-semibold mt-1">
                    💰 Refund: ₹{r.refundAmount}
                  </p>
                  <p className="text-[10px] text-muted mt-1">
                    Requested: {new Date(r.requestedAt).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedReturn(r)}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-dark text-xs font-semibold hover:bg-gray-200 transition flex items-center gap-1"
                  >
                    <FiEye /> View
                  </button>

                  {r.status === "REQUESTED" && (
                    <>
                      <button
                        onClick={() => handleApprove(r._id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <FiCheck /> Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReturn(r);
                          setShowRejectModal(true);
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <FiX /> Reject
                      </button>
                    </>
                  )}

                  {r.status === "APPROVED" && (
                    <button
                      onClick={() => handleSchedulePickup(r._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <FiTruck /> Schedule Pickup
                    </button>
                  )}

                  {r.status === "PICKED_UP" && (
                    <button
                      onClick={() => handleMarkReceived(r._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-xs font-semibold hover:bg-cyan-600 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <FiPackage /> Mark Received
                    </button>
                  )}

                  {r.status === "RECEIVED" && (
                    <button
                      onClick={() => handleProcessRefund(r._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <FiDollarSign /> Process Refund
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {selectedReturn && !showRejectModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedReturn(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg">
                Return Details
              </h2>
              <button
                onClick={() => setSelectedReturn(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <FiX />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Customer Info */}
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-700 mb-2">
                  👤 Customer
                </p>
                <p className="text-sm font-semibold">
                  {selectedReturn.user?.name}
                </p>
                <p className="text-xs text-muted">
                  {selectedReturn.user?.email} • {selectedReturn.user?.phone}
                </p>
              </div>

              {/* Item */}
              <div className="flex gap-3">
                <img
                  src={selectedReturn.item?.image}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {selectedReturn.item?.name}
                  </p>
                  <p className="text-xs text-muted">
                    Qty: {selectedReturn.item?.qty}
                  </p>
                  <p className="text-sm font-bold text-primary mt-1">
                    ₹
                    {selectedReturn.item?.finalPrice *
                      selectedReturn.item?.qty}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-xs font-bold text-muted mb-1">
                  Reason:
                </p>
                <p className="text-sm">
                  {REASON_LABELS[selectedReturn.reason] ||
                    selectedReturn.reason}
                </p>
                {selectedReturn.reasonText && (
                  <p className="text-xs text-muted mt-1">
                    "{selectedReturn.reasonText}"
                  </p>
                )}
              </div>

              {/* Photos */}
              {selectedReturn.images?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted mb-2">
                    Photos:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReturn.images.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="w-full h-24 object-cover rounded-lg cursor-pointer"
                        onClick={() => window.open(url, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Refund Info */}
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs font-bold text-green-700 mb-1">
                  💰 Refund Info
                </p>
                <p className="text-sm">
                  Amount:{" "}
                  <b className="text-green-700">
                    ₹{selectedReturn.refundAmount}
                  </b>
                </p>
                <p className="text-xs text-muted">
                  Method: {selectedReturn.refundMethod}
                </p>
              </div>

              {/* Status Timeline */}
              <div>
                <p className="text-xs font-bold text-muted mb-2">
                  Timeline:
                </p>
                <div className="space-y-1 text-xs">
                  <p>
                    ✓ Requested:{" "}
                    {new Date(selectedReturn.requestedAt).toLocaleString("en-IN")}
                  </p>
                  {selectedReturn.approvedAt && (
                    <p>
                      ✓ Approved:{" "}
                      {new Date(selectedReturn.approvedAt).toLocaleString("en-IN")}
                    </p>
                  )}
                  {selectedReturn.pickedUpAt && (
                    <p>
                      ✓ Picked Up:{" "}
                      {new Date(selectedReturn.pickedUpAt).toLocaleString("en-IN")}
                    </p>
                  )}
                  {selectedReturn.receivedAt && (
                    <p>
                      ✓ Received:{" "}
                      {new Date(selectedReturn.receivedAt).toLocaleString("en-IN")}
                    </p>
                  )}
                  {selectedReturn.completedAt && (
                    <p className="text-green-600 font-semibold">
                      ✓ Completed:{" "}
                      {new Date(selectedReturn.completedAt).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedReturn && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowRejectModal(false);
            setRejectReason("");
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading font-bold text-lg mb-3">
              ❌ Reject Return
            </h2>
            <p className="text-sm text-muted mb-3">
              Customer ko batayein kyun reject kar rahe hain
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason likhein..."
              rows={3}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerReturns;