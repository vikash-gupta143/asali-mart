import { useState, useEffect } from "react";
import {
  FiPackage, FiCheck, FiX, FiTruck, FiClock,
  FiAlertCircle, FiEye, FiDollarSign, FiRefreshCw,
  FiUser, FiFilter, FiSearch, FiTrendingUp,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useSocket } from "../../context/SocketContext";

const STATUS_FILTERS = [
  { id: "ALL", label: "All Returns", color: "bg-gray-100" },
  { id: "REQUESTED", label: "New", color: "bg-yellow-100" },
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

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const socket = useSocket();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/returns/admin/all?status=${filter}`);
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

  // 🔔 Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNew = () => {
      load();
    };

    socket.on("return:new", handleNew);
    return () => socket.off("return:new", handleNew);
  }, [socket]);

  // Load delivery partners when schedule modal opens
  useEffect(() => {
    if (!showScheduleModal) return;

    const loadPartners = async () => {
      try {
        const res = await api.get("/delivery-partners?status=APPROVED");
        setDeliveryPartners(res.data.partners || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadPartners();
  }, [showScheduleModal]);

  // Schedule pickup
  const handleSchedulePickup = async () => {
    if (!selectedPartner) {
      toast.error("Delivery partner select karein");
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/returns/${selectedReturn._id}/schedule-pickup`, {
        pickupPartnerId: selectedPartner,
      });
      toast.success("🚚 Pickup schedule ho gaya!");
      setShowScheduleModal(false);
      setSelectedPartner("");
      setSelectedReturn(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Pickup failed");
    } finally {
      setActionLoading(false);
    }
  };


  // 🚚 Auto-Assign Pickup
const handleAutoAssign = async (returnId) => {
  if (
    !window.confirm(
      "Auto-assign karein? Nearest delivery partner ko notification jayegi."
    )
  )
    return;

  try {
    setActionLoading(true);
    const res = await api.put(`/returns/${returnId}/auto-assign`);

    toast.success(
      `🚚 Auto-assign successful! ${res.data.notifiedPartners || 0} partners ko notification bheja`
    );
    load();
  } catch (err) {
    console.error(err);
    toast.error(
      err.response?.data?.message || "Auto-assign failed. Koi nearby partner nahi mila."
    );
  } finally {
    setActionLoading(false);
  }
};

  // Filter by search
  const filteredReturns = returns.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.order?.orderNumber?.toLowerCase().includes(q) ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.item?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container-custom py-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-heading font-bold text-2xl">
            👑 Returns Dashboard
          </h1>
          <p className="text-sm text-muted mt-1">
            Saare returns manage karein
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-yellow-400">
            <p className="text-xs text-muted">New Requests</p>
            <p className="font-heading font-bold text-2xl text-yellow-600">
              {stats.totalRequested || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-blue-400">
            <p className="text-xs text-muted">Approved</p>
            <p className="font-heading font-bold text-2xl text-blue-600">
              {stats.totalApproved || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-green-400">
            <p className="text-xs text-muted">Completed</p>
            <p className="font-heading font-bold text-2xl text-green-600">
              {stats.totalCompleted || 0}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-red-400">
            <p className="text-xs text-muted">Rejected</p>
            <p className="font-heading font-bold text-2xl text-red-600">
              {stats.totalRejected || 0}
            </p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order #, customer, item search karein..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filter === f.id
                  ? "bg-primary text-white shadow"
                  : `${f.color} text-dark hover:opacity-80`
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Returns List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted mt-3">Loading...</p>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-10 text-center">
          <FiRefreshCw className="text-4xl text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">Koi return nahi mila</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReturns.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-primary"
            >
              <div className="flex items-start gap-4 flex-wrap">
                <img
                  src={r.item?.image}
                  alt={r.item?.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />

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

                  <p className="text-xs text-muted">
                    🏪 Seller: {r.seller?.name} • 👤 {r.user?.name}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {REASON_LABELS[r.reason] || r.reason}
                  </p>
                  <p className="text-xs text-primary font-semibold mt-1">
                    💰 ₹{r.refundAmount}
                  </p>
                  <p className="text-[10px] text-muted mt-1">
                    {new Date(r.requestedAt).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedReturn(r)}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-dark text-xs font-semibold hover:bg-gray-200 transition flex items-center gap-1"
                  >
                    <FiEye /> View
                  </button>

                  {r.status === "APPROVED" && (
  <button
    onClick={() => handleAutoAssign(r._id)}
    disabled={actionLoading}
    className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition disabled:opacity-50 flex items-center gap-1"
  >
    <FiTruck /> Auto-Assign
  </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {selectedReturn && !showScheduleModal && (
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
              {/* Customer & Seller */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-700 mb-1">
                    👤 Customer
                  </p>
                  <p className="text-sm font-semibold">
                    {selectedReturn.user?.name}
                  </p>
                  <p className="text-xs text-muted">
                    {selectedReturn.user?.phone}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-purple-700 mb-1">
                    🏪 Seller
                  </p>
                  <p className="text-sm font-semibold">
                    {selectedReturn.seller?.name}
                  </p>
                  <p className="text-xs text-muted">
                    {selectedReturn.seller?.phone}
                  </p>
                </div>
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
                <p className="text-xs font-bold text-muted mb-1">Reason:</p>
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

              {/* Timeline */}
              <div>
                <p className="text-xs font-bold text-muted mb-2">
                  Timeline:
                </p>
                <div className="space-y-1 text-xs">
                  <p>
                    ✓ Requested:{" "}
                    {new Date(selectedReturn.requestedAt).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                  {selectedReturn.approvedAt && (
                    <p>
                      ✓ Approved:{" "}
                      {new Date(selectedReturn.approvedAt).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  )}
                  {selectedReturn.pickedUpAt && (
                    <p>
                      ✓ Picked Up:{" "}
                      {new Date(selectedReturn.pickedUpAt).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  )}
                  {selectedReturn.receivedAt && (
                    <p>
                      ✓ Received:{" "}
                      {new Date(selectedReturn.receivedAt).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  )}
                  {selectedReturn.completedAt && (
                    <p className="text-green-600 font-semibold">
                      ✓ Completed:{" "}
                      {new Date(selectedReturn.completedAt).toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Pickup Modal */}
      {showScheduleModal && selectedReturn && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowScheduleModal(false);
            setSelectedPartner("");
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading font-bold text-lg mb-3">
              🚚 Assign Pickup Partner
            </h2>
            <p className="text-sm text-muted mb-3">
              Delivery partner select karein jo return pickup karega
            </p>

            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm mb-4"
            >
              <option value="">-- Select Partner --</option>
              {deliveryPartners.map((p) => (
                <option key={p._id} value={p.user?._id || p._id}>
                  {p.fullName || p.user?.name} ({p.phone || p.user?.phone})
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedPartner("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedulePickup}
                disabled={actionLoading || !selectedPartner}
                className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50"
              >
                {actionLoading ? "Assigning..." : "Assign Pickup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturns;