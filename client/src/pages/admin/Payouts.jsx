import { useState, useEffect } from "react";
import {
  FiDollarSign, FiSearch, FiCheck, FiX, FiClock,
  FiAlertCircle, FiCreditCard, FiUser, FiExternalLink,
  FiSave,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  fetchAllPayouts,
  approvePayoutApi,
  rejectPayoutApi,
  markPayoutPaidApi,
  verifySellerBankApi,
} from "../../services/adminService";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  PAID: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState(null);
  const [paidModal, setPaidModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAllPayouts(status);
      setPayouts(data.payouts || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this payout? Phir manually bank transfer karein.")) return;
    try {
      setProcessing(id);
      await approvePayoutApi(id, "Approved by admin");
      toast.success("Payout approved!");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id, reason) => {
    try {
      setProcessing(id);
      await rejectPayoutApi(id, reason);
      toast.success("Payout rejected — amount seller wallet me wapas");
      setRejectModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkPaid = async (id, data) => {
    try {
      setProcessing(id);
      await markPayoutPaidApi(id, data);
      toast.success("Payout marked as paid!");
      setPaidModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleVerifyBank = async (sellerId) => {
    if (!window.confirm("Verify this seller's bank account?")) return;
    try {
      await verifySellerBankApi(sellerId);
      toast.success("Bank verified!");
      load();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const filtered = payouts.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.seller?.name?.toLowerCase().includes(q) ||
      p.seller?.email?.toLowerCase().includes(q) ||
      p._id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl">💰 Payouts</h1>
        <p className="text-sm text-muted">
          Seller withdraw requests manage karein
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiClock className="text-orange-500 text-xl" />
              <p className="text-xs text-muted">Pending</p>
            </div>
            <p className="font-heading font-bold text-2xl">
              {stats.totalPending || 0}
            </p>
            <p className="text-xs text-muted mt-1">
              ₹{(stats.pendingAmount || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiDollarSign className="text-blue-500 text-xl" />
              <p className="text-xs text-muted">Approved</p>
            </div>
            <p className="font-heading font-bold text-2xl">
              {stats.totalApproved || 0}
            </p>
            <p className="text-xs text-muted mt-1">
              ₹{(stats.approvedAmount || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiCheck className="text-green-500 text-xl" />
              <p className="text-xs text-muted">Paid</p>
            </div>
            <p className="font-heading font-bold text-2xl">
              {stats.totalPaid || 0}
            </p>
            <p className="text-xs text-muted mt-1">
              ₹{(stats.paidAmount || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary to-primary-light rounded-xl shadow-card p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <FiAlertCircle className="text-xl opacity-90" />
              <p className="text-xs opacity-90">Total Requests</p>
            </div>
            <p className="font-heading font-bold text-2xl">
              {payouts.length}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            placeholder="Search by seller name, email..."
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
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiDollarSign className="text-5xl text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No payout requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p._id} className="bg-white rounded-xl shadow-card p-5">
              {/* Header */}
              <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg">
                    {p.seller?.name?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {p.seller?.name || "Seller"}
                    </p>
                    <p className="text-xs text-muted">{p.seller?.email}</p>
                    <p className="text-[10px] text-muted mt-0.5">
                      Requested:{" "}
                      {new Date(p.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[p.status]}`}
                >
                  {p.status}
                </span>
              </div>

              {/* Amount */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 mb-4">
                <p className="text-xs text-green-700 mb-1">Withdraw Amount</p>
                <p className="font-heading font-bold text-3xl text-green-600">
                  ₹{p.amount?.toLocaleString()}
                </p>
              </div>

              {/* Bank Details */}
              <div className="p-4 rounded-xl bg-bg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-semibold text-muted uppercase">
                    🏦 Bank Details
                  </p>
                  {!p.seller?.bankDetails?.isVerified && (
                    <button
                      onClick={() => handleVerifyBank(p.seller._id)}
                      className="text-[10px] text-primary font-semibold hover:underline"
                    >
                      Verify Bank
                    </button>
                  )}
                  {p.seller?.bankDetails?.isVerified && (
                    <span className="text-[10px] text-green-600 font-semibold">
                      ✅ Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted">Holder</p>
                    <p className="font-medium">
                      {p.bankDetails?.accountHolderName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">Account</p>
                    <p className="font-medium">
                      XXXX-{p.bankDetails?.accountNumber?.slice(-4) || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">IFSC</p>
                    <p className="font-medium">{p.bankDetails?.ifscCode || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted">Bank</p>
                    <p className="font-medium">
                      {p.bankDetails?.bankName || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reference ID (if paid) */}
              {p.status === "PAID" && p.referenceId && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 mb-4 text-xs">
                  <p className="text-green-700">
                    <b>Reference ID:</b> {p.referenceId}
                  </p>
                  <p className="text-green-600 mt-0.5">
                    Paid: {new Date(p.paidAt).toLocaleString("en-IN")}
                  </p>
                </div>
              )}

              {p.status === "REJECTED" && p.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-4 text-xs">
                  <p className="text-red-700">
                    <b>Rejection reason:</b> {p.rejectionReason}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                {p.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleApprove(p._id)}
                      disabled={processing === p._id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      onClick={() => setRejectModal(p)}
                      disabled={processing === p._id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
                    >
                      <FiX /> Reject
                    </button>
                  </>
                )}

                {p.status === "APPROVED" && (
                  <button
                    onClick={() => setPaidModal(p)}
                    disabled={processing === p._id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50"
                  >
                    <FiDollarSign /> Mark as Paid
                  </button>
                )}

                {p.status === "PAID" && (
                  <div className="flex-1 text-center text-sm text-green-600 font-semibold py-2.5">
                    ✅ Payout Complete
                  </div>
                )}

                {p.status === "REJECTED" && (
                  <div className="flex-1 text-center text-sm text-red-600 font-semibold py-2.5">
                    ❌ Rejected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mark Paid Modal */}
      {paidModal && (
        <MarkPaidModal
          payout={paidModal}
          onClose={() => setPaidModal(null)}
          onSubmit={(data) => handleMarkPaid(paidModal._id, data)}
        />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <RejectModal
          payout={rejectModal}
          onClose={() => setRejectModal(null)}
          onSubmit={(reason) => handleReject(rejectModal._id, reason)}
        />
      )}
    </div>
  );
};

// ============================================
// Mark Paid Modal
// ============================================
const MarkPaidModal = ({ payout, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    referenceId: "",
    transactionId: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.referenceId.trim()) {
      toast.error("Reference ID required");
      return;
    }
    try {
      setLoading(true);
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6 my-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold text-lg">
            💰 Mark Payout as Paid
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg">
            <FiX />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-bg mb-4 text-sm">
          <p className="text-muted mb-1">Seller:</p>
          <p className="font-semibold">{payout.seller?.name}</p>
          <p className="text-muted text-xs mt-2 mb-1">Amount:</p>
          <p className="font-heading font-bold text-2xl text-green-600">
            ₹{payout.amount?.toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-4 text-xs">
          <p className="font-semibold text-blue-700 mb-2">
            🏦 Transfer to:
          </p>
          <p className="text-blue-800">
            {payout.bankDetails?.accountHolderName}
          </p>
          <p className="text-blue-700">
            {payout.bankDetails?.bankName} • XXXX-
            {payout.bankDetails?.accountNumber?.slice(-4)}
          </p>
          <p className="text-blue-700">IFSC: {payout.bankDetails?.ifscCode}</p>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Reference ID (UTR) *
            </label>
            <input
              type="text"
              value={form.referenceId}
              onChange={(e) =>
                setForm({ ...form, referenceId: e.target.value })
              }
              placeholder="UTR12345678"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
            <p className="text-[10px] text-muted mt-1">
              Bank UTR / Reference number (transfer ke baad milega)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Transaction ID (optional)
            </label>
            <input
              type="text"
              value={form.transactionId}
              onChange={(e) =>
                setForm({ ...form, transactionId: e.target.value })
              }
              placeholder="HDFC123456"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Notes (optional)
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Paid via NEFT"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>
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
            disabled={loading || !form.referenceId.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm disabled:opacity-50"
          >
            <FiSave /> {loading ? "Processing..." : "Confirm Paid"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Reject Modal
// ============================================
const RejectModal = ({ payout, onClose, onSubmit }) => {
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
            ❌ Reject Payout
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg">
            <FiX />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-bg mb-4 text-sm">
          <p className="text-muted mb-1">Seller:</p>
          <p className="font-semibold">{payout.seller?.name}</p>
          <p className="text-muted text-xs mt-2 mb-1">Amount:</p>
          <p className="font-heading font-bold text-xl text-red-600">
            ₹{payout.amount?.toLocaleString()}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 mb-4 text-xs text-yellow-700">
          ⚠️ Reject karne par amount seller ke wallet me wapas chala jayega.
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">
            Rejection Reason *
          </label>
          <textarea
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Invalid bank details, KYC pending..."
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

export default AdminPayouts;