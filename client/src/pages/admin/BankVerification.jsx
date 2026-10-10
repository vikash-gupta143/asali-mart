import { useState, useEffect } from "react";
import {
  FiSearch, FiCheck, FiX, FiCreditCard, FiUser,
  FiAlertCircle, FiSmartphone, FiTruck, FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  fetchBankVerifications,
  verifySellerBankDetailsApi,
  rejectSellerBankDetailsApi,
} from "../../services/adminService";
import api from "../../services/api";

const AdminBankVerification = () => {
  const [activeTab, setActiveTab] = useState("SELLER");
  const [sellers, setSellers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const load = async () => {
    try {
      setLoading(true);

      if (activeTab === "SELLER") {
        const data = await fetchBankVerifications(status);
        setSellers(data.sellers || []);
        setStats(data.stats || null);
      } else {
        const res = await api.get("/admin/delivery-bank-verifications", {
          params: { status },
        });
        setPartners(res.data.partners || []);
        setStats(res.data.stats || null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [status, activeTab]);

  const handleVerify = async (id) => {
    if (!window.confirm("Verify this account?")) return;
    try {
      setProcessing(id);
      if (activeTab === "SELLER") {
        await verifySellerBankDetailsApi(id);
      } else {
        await api.put(`/admin/delivery-bank-verifications/${id}/verify`);
      }
      toast.success("Verified!");
      await load(); // 🆕 await lagaya taaki refresh ho jaye
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id, reason) => {
    try {
      setProcessing(id);
      if (activeTab === "SELLER") {
        await rejectSellerBankDetailsApi(id, reason);
      } else {
        await api.put(`/admin/delivery-bank-verifications/${id}/reject`, {
          reason,
        });
      }
      toast.success("Rejected");
      setRejectModal(null);
      await load();
    } catch (err) {
      toast.error("Failed");
    } finally {
      setProcessing(null);
    }
  };

  const list = activeTab === "SELLER" ? sellers : partners;

  const filtered = list.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.fullName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.includes(search)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl">
          🏦 Bank & UPI Verification
        </h1>
        <p className="text-sm text-muted">
          Sellers aur Delivery Partners ke payment details verify karein
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 shadow-card">
        <button
          onClick={() => setActiveTab("SELLER")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === "SELLER"
              ? "bg-primary text-white"
              : "text-muted hover:bg-bg"
          }`}
        >
          <FiUsers /> Sellers
        </button>
        <button
          onClick={() => setActiveTab("DELIVERY")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === "DELIVERY"
              ? "bg-primary text-white"
              : "text-muted hover:bg-bg"
          }`}
        >
          <FiTruck /> Delivery Partners
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiAlertCircle className="text-orange-500 text-xl" />
              <p className="text-xs text-muted">Pending</p>
            </div>
            <p className="font-heading font-bold text-2xl">
              {stats.totalPending || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiCheck className="text-green-500 text-xl" />
              <p className="text-xs text-muted">Verified</p>
            </div>
            <p className="font-heading font-bold text-2xl">
              {stats.totalVerified || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary-light rounded-xl shadow-card p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <FiCreditCard className="text-xl opacity-90" />
              <p className="text-xs opacity-90">Total</p>
            </div>
            <p className="font-heading font-bold text-2xl">
              {stats.total || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white shadow-card border border-transparent outline-none focus:border-primary text-sm"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="p-3 rounded-xl bg-white shadow-card text-sm outline-none"
        >
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="ALL">All</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiCreditCard className="text-5xl text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">
            {status === "PENDING"
              ? "Koi pending verification nahi hai"
              : "Koi user nahi mila"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => {
            // 🆕 Check if bank/upi verified
            const bankVerified = user.bankDetails?.isVerified;
            const upiVerified = user.upiDetails?.isVerified;
            const hasBank = user.bankDetails?.accountNumber;
            const hasUpi = user.upiDetails?.upiId;
            const allVerified = bankVerified && upiVerified;

            return (
              <div
                key={user._id}
                className="bg-white rounded-xl shadow-card p-5"
              >
                {/* Header */}
                <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg">
                      {(user.name || user.fullName)?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {user.name || user.fullName}
                      </p>
                      <p className="text-xs text-muted">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-muted">📞 {user.phone}</p>
                      )}
                    </div>
                  </div>

                  {allVerified ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      ✅ Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      ⏳ Pending
                    </span>
                  )}
                </div>

                {/* 🏦 Bank Details */}
                <div className="p-4 rounded-xl bg-bg mb-3">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs font-semibold text-muted uppercase flex items-center gap-2">
                      <FiCreditCard /> Bank Account
                    </p>
                    {hasBank && (
                      bankVerified ? (
                        <span className="text-[10px] text-green-600 font-semibold">
                          ✅ Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-yellow-600 font-semibold">
                          ⏳ Pending
                        </span>
                      )
                    )}
                  </div>

                  {hasBank ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted">Account Holder</p>
                        <p className="font-semibold">
                          {user.bankDetails.accountHolderName || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">Account Number</p>
                        <p className="font-semibold">
                          {user.bankDetails.accountNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">IFSC</p>
                        <p className="font-semibold">
                          {user.bankDetails.ifscCode || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">Bank</p>
                        <p className="font-semibold">
                          {user.bankDetails.bankName || "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">
                      ❌ Bank details add nahi ki
                    </p>
                  )}
                </div>

                {/* 📱 UPI Details */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-3">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase flex items-center gap-2">
                      <FiSmartphone /> UPI Details
                    </p>
                    {hasUpi && (
                      upiVerified ? (
                        <span className="text-[10px] text-green-600 font-semibold">
                          ✅ Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-yellow-600 font-semibold">
                          ⏳ Pending
                        </span>
                      )
                    )}
                  </div>

                  {hasUpi ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-blue-600">UPI ID</p>
                          <p className="font-mono font-semibold text-blue-800">
                            {user.upiDetails.upiId}
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-600">QR Code</p>
                          <p className="font-semibold text-blue-800">
                            {user.upiDetails.qrCodeUrl ? "✅ Uploaded" : "❌ Not uploaded"}
                          </p>
                        </div>
                      </div>

                      {user.upiDetails.qrCodeUrl && (
                        <div className="mt-3">
                          <img
                            src={user.upiDetails.qrCodeUrl}
                            alt="UPI QR"
                            className="w-24 h-24 rounded-lg border border-blue-200 object-cover"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-blue-700">
                      ❌ UPI ID add nahi ki
                    </p>
                  )}
                </div>

                {/* Actions */}
                {!allVerified && (hasBank || hasUpi) && (
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleVerify(user._id)}
                      disabled={processing === user._id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      <FiCheck />
                      {processing === user._id ? "Verifying..." : "Verify"}
                    </button>
                    <button
                      onClick={() => setRejectModal(user)}
                      disabled={processing === user._id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                )}

                {allVerified && (
                  <div className="text-center text-sm text-green-600 font-semibold py-2.5">
                    ✅ Bank & UPI Verified — Payouts allowed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <RejectBankModal
          user={rejectModal}
          onClose={() => setRejectModal(null)}
          onSubmit={(reason) => handleReject(rejectModal._id, reason)}
        />
      )}
    </div>
  );
};

// Reject Modal
const RejectBankModal = ({ user, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Rejection reason required");
      return;
    }
    try {
      setLoading(true);
      await onSubmit(reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold text-lg">
            ❌ Reject Bank/UPI Details
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg">
            <FiX />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-bg mb-4 text-sm">
          <p className="text-muted mb-1">User:</p>
          <p className="font-semibold">{user.name || user.fullName}</p>
          <p className="text-xs text-muted">{user.email}</p>
        </div>

        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 mb-4 text-xs text-yellow-700">
          ⚠️ Reject karne par user ko dobara bank/UPI details daalni padengi
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">
            Rejection Reason *
          </label>
          <textarea
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Invalid account number, IFSC mismatch..."
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-50"
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBankVerification;