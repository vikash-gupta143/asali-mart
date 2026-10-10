import { useState, useEffect } from "react";
import {
  FiDollarSign, FiArrowUpRight, FiClock, FiCheck, FiX,
  FiTrendingUp, FiCreditCard, FiEdit2, FiSave, FiAlertCircle,
  FiSmartphone, FiUpload,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  fetchSellerWallet,
  updateBankDetailsApi,
  requestWithdrawApi,
  fetchMyPayouts,
} from "../../services/sellerService";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  PAID: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);
  const [upiDetails, setUpiDetails] = useState(null); // 🆕
  const [loading, setLoading] = useState(true);

  // Modals
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showUpi, setShowUpi] = useState(false); // 🆕

  const load = async () => {
    try {
      setLoading(true);
      const [walletRes, payoutsRes] = await Promise.all([
        fetchSellerWallet(),
        fetchMyPayouts(),
      ]);
      setWallet(
        walletRes.wallet || {
          available: 0,
          pending: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        }
      );
      setBankDetails(walletRes.bankDetails || {});
      setUpiDetails(walletRes.upiDetails || {}); // 🆕
      setPayouts(payoutsRes.payouts || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 text-muted">Loading wallet...</div>
    );
  }

  // 🆕 Can withdraw: Bank OR UPI must be verified
  const bankOk =
    bankDetails?.accountNumber && bankDetails?.isVerified;
  const upiOk = upiDetails?.upiId && upiDetails?.isVerified;

  const canWithdraw =
    wallet?.available >= 500 &&
    (bankOk || upiOk) &&
    !payouts.some((p) =>
      ["PENDING", "APPROVED", "PROCESSING"].includes(p.status)
    );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-2xl">💰 Wallet</h1>
        <p className="text-sm text-muted">
          Apni earnings dekhein aur withdraw karein
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-card">
        <div className="flex items-center gap-2 mb-2 opacity-90">
          <FiDollarSign className="text-xl" />
          <p className="text-xs uppercase tracking-wider font-semibold">
            Available Balance
          </p>
        </div>
        <p className="font-heading font-bold text-4xl mb-5">
          ₹{(wallet?.available || 0).toLocaleString()}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] opacity-80 mb-0.5">Pending</p>
            <p className="font-bold text-sm">
              ₹{(wallet?.pending || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] opacity-80 mb-0.5">Total Earned</p>
            <p className="font-bold text-sm">
              ₹{(wallet?.totalEarned || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] opacity-80 mb-0.5">Withdrawn</p>
            <p className="font-bold text-sm">
              ₹{(wallet?.totalWithdrawn || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowWithdraw(true)}
          disabled={!canWithdraw}
          className="w-full py-3 rounded-xl bg-white text-green-700 font-semibold text-sm hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <FiArrowUpRight /> Withdraw Money
        </button>

        {/* 🆕 Warnings */}
        {!bankOk && !upiOk && (
          <p className="text-[11px] text-white/90 mt-2 text-center">
            ⚠️ Pehle Bank ya UPI details add karein
          </p>
        )}
        {(bankDetails?.accountNumber && !bankDetails?.isVerified) &&
          (upiDetails?.upiId && !upiDetails?.isVerified) && (
            <p className="text-[11px] text-white/90 mt-2 text-center">
              ⏳ Verification pending (Bank & UPI)
            </p>
          )}
        {wallet?.available > 0 && wallet?.available < 500 && (
          <p className="text-[11px] text-white/90 mt-2 text-center">
            Minimum ₹500 withdraw ke liye zaroori hai
          </p>
        )}
      </div>

      {/* 🏦 Bank Details Card */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold flex items-center gap-2">
            <FiCreditCard className="text-primary" /> Bank Details
          </h3>
          <button
            onClick={() => setShowBank(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <FiEdit2 /> {bankDetails?.accountNumber ? "Update" : "Add"}
          </button>
        </div>

        {bankDetails?.accountNumber ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-muted uppercase mb-0.5">
                  Account Holder
                </p>
                <p className="font-medium">{bankDetails.accountHolderName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase mb-0.5">
                  Account Number
                </p>
                <p className="font-medium">
                  XXXX-{bankDetails.accountNumber?.slice(-4)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase mb-0.5">IFSC</p>
                <p className="font-medium">{bankDetails.ifscCode}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase mb-0.5">Bank</p>
                <p className="font-medium">{bankDetails.bankName || "—"}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t flex items-center gap-2">
              {bankDetails.isVerified ? (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <FiCheck /> Bank Verified
                </span>
              ) : (
                <span className="text-xs text-yellow-600 font-semibold flex items-center gap-1">
                  <FiClock /> Verification Pending
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <FiAlertCircle className="text-3xl text-muted mx-auto mb-2" />
            <p className="text-sm text-muted mb-3">
              Bank details add karein
            </p>
            <button
              onClick={() => setShowBank(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              Add Bank Details
            </button>
          </div>
        )}
      </div>

      {/* 🆕 UPI Details Card */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold flex items-center gap-2">
            <FiSmartphone className="text-primary" /> UPI Details
          </h3>
          <button
            onClick={() => setShowUpi(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <FiEdit2 /> {upiDetails?.upiId ? "Update" : "Add"}
          </button>
        </div>

        {upiDetails?.upiId ? (
          <>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 mb-3">
              <p className="text-[10px] text-blue-600 uppercase mb-1">
                UPI ID
              </p>
              <p className="font-mono font-semibold text-blue-800">
                {upiDetails.upiId}
              </p>
            </div>

            {upiDetails.qrCodeUrl && (
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={upiDetails.qrCodeUrl}
                  alt="UPI QR"
                  className="w-20 h-20 rounded-xl border border-gray-200 object-cover"
                />
                <p className="text-xs text-muted">Aapka UPI QR Code</p>
              </div>
            )}

            <div className="pt-3 border-t flex items-center gap-2">
              {upiDetails.isVerified ? (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <FiCheck /> UPI Verified
                </span>
              ) : (
                <span className="text-xs text-yellow-600 font-semibold flex items-center gap-1">
                  <FiClock /> Verification Pending
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <FiSmartphone className="text-3xl text-muted mx-auto mb-2" />
            <p className="text-sm text-muted mb-3">
              UPI ID add karein (fast payout ke liye)
            </p>
            <button
              onClick={() => setShowUpi(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              Add UPI Details
            </button>
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-primary" /> Payout History
        </h3>

        {payouts.length === 0 ? (
          <div className="text-center py-6">
            <FiDollarSign className="text-3xl text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">No payouts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((p) => (
              <div
                key={p._id}
                className="p-4 rounded-xl bg-bg border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-heading font-bold text-lg">
                      ₹{p.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted mt-0.5">
                      Requested:{" "}
                      {new Date(p.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColors[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>

                {/* 🆕 Payment method */}
                <p className="text-xs text-muted">
                  {p.bankDetails?.accountNumber
                    ? `🏦 ${p.bankDetails.bankName} • XXXX-${p.bankDetails.accountNumber?.slice(-4)}`
                    : p.upiDetails?.upiId
                    ? `📱 UPI: ${p.upiDetails.upiId}`
                    : "—"}
                </p>

                {/* Reference (if paid) */}
                {p.status === "PAID" && p.referenceId && (
                  <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-[10px] text-green-700">
                      <b>UTR:</b> {p.referenceId}
                    </p>
                    {p.paidAt && (
                      <p className="text-[10px] text-green-600 mt-0.5">
                        Paid: {new Date(p.paidAt).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                )}

                {/* Rejection reason */}
                {p.status === "REJECTED" && p.rejectionReason && (
                  <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-[10px] text-red-700">
                      <b>Reason:</b> {p.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showWithdraw && (
        <WithdrawModal
          wallet={wallet}
          bankDetails={bankDetails}
          upiDetails={upiDetails}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => {
            setShowWithdraw(false);
            load();
          }}
        />
      )}

      {showBank && (
        <BankModal
          bankDetails={bankDetails}
          onClose={() => setShowBank(false)}
          onSuccess={() => {
            setShowBank(false);
            load();
          }}
        />
      )}

      {showUpi && (
        <UpiModal
          upiDetails={upiDetails}
          onClose={() => setShowUpi(false)}
          onSuccess={() => {
            setShowUpi(false);
            load();
          }}
        />
      )}
    </div>
  );
};

// ============================================
// Withdraw Modal
// ============================================
const WithdrawModal = ({ wallet, bankDetails, upiDetails, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState(
    bankDetails?.isVerified ? "BANK" : upiDetails?.isVerified ? "UPI" : "BANK"
  );

  const handleSubmit = async () => {
    const num = Number(amount);
    if (!num || num < 500) {
      toast.error("Minimum withdraw ₹500");
      return;
    }
    if (num > wallet.available) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setLoading(true);
      await requestWithdrawApi(num, method);
      toast.success("Withdraw request submitted!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6 my-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold text-lg">💰 Withdraw Money</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg">
            <FiX />
          </button>
        </div>

        {/* Available */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 mb-4">
          <p className="text-xs text-green-700 mb-1">Available Balance</p>
          <p className="font-heading font-bold text-3xl text-green-600">
            ₹{wallet.available.toLocaleString()}
          </p>
        </div>

        {/* 🆕 Payment Method */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Withdraw to:</p>
          <div className="grid grid-cols-2 gap-2">
            {bankDetails?.isVerified && (
              <button
                onClick={() => setMethod("BANK")}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  method === "BANK"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                }`}
              >
                <FiCreditCard className="text-primary mb-1" />
                <p className="font-semibold text-xs">Bank</p>
                <p className="text-[10px] text-muted">
                  XXXX-{bankDetails.accountNumber?.slice(-4)}
                </p>
              </button>
            )}
            {upiDetails?.isVerified && (
              <button
                onClick={() => setMethod("UPI")}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  method === "UPI"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                }`}
              >
                <FiSmartphone className="text-primary mb-1" />
                <p className="font-semibold text-xs">UPI</p>
                <p className="text-[10px] text-muted truncate">
                  {upiDetails.upiId}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">
            Withdraw Amount *
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Minimum ₹500"
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
          />
          <p className="text-[10px] text-muted mt-1">
            Minimum ₹500 • Maximum ₹{wallet.available.toLocaleString()}
          </p>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-4">
          {[500, 1000, 2000, wallet.available].map(
            (amt, i) =>
              amt >= 500 &&
              amt <= wallet.available && (
                <button
                  key={i}
                  onClick={() => setAmount(String(amt))}
                  className="flex-1 py-2 rounded-lg bg-bg text-xs font-semibold hover:bg-primary/10 transition"
                >
                  ₹{amt.toLocaleString()}
                </button>
              )
          )}
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
            disabled={loading || !amount}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : "Request Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Bank Modal
// ============================================
const BankModal = ({ bankDetails, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    accountHolderName: bankDetails?.accountHolderName || "",
    accountNumber: bankDetails?.accountNumber || "",
    ifscCode: bankDetails?.ifscCode || "",
    bankName: bankDetails?.bankName || "",
    branchName: bankDetails?.branchName || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (
      !form.accountHolderName.trim() ||
      !form.accountNumber.trim() ||
      !form.ifscCode.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      await updateBankDetailsApi(form);
      toast.success("Bank details updated! Admin will verify.");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6 my-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold text-lg">🏦 Bank Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg">
            <FiX />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 mb-4 text-xs text-yellow-700">
          ⚠️ Bank details verify karne me 1-2 din lag sakte hain.
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Account Holder Name *
            </label>
            <input
              type="text"
              value={form.accountHolderName}
              onChange={(e) =>
                setForm({ ...form, accountHolderName: e.target.value })
              }
              placeholder="Vikash Kumar"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Account Number *
            </label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) =>
                setForm({ ...form, accountNumber: e.target.value })
              }
              placeholder="1234567890"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              IFSC Code *
            </label>
            <input
              type="text"
              value={form.ifscCode}
              onChange={(e) =>
                setForm({ ...form, ifscCode: e.target.value.toUpperCase() })
              }
              placeholder="HDFC0001234"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Bank Name
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) =>
                  setForm({ ...form, bankName: e.target.value })
                }
                placeholder="HDFC Bank"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Branch</label>
              <input
                type="text"
                value={form.branchName}
                onChange={(e) =>
                  setForm({ ...form, branchName: e.target.value })
                }
                placeholder="Andheri"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
            </div>
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
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50"
          >
            <FiSave /> {loading ? "Saving..." : "Save Details"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 🆕 UPI Modal
// ============================================
const UpiModal = ({ upiDetails, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    upiId: upiDetails?.upiId || "",
    qrCodeUrl: upiDetails?.qrCodeUrl || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.upiId.trim() || !form.upiId.includes("@")) {
      toast.error("Valid UPI ID daalein (e.g. name@paytm)");
      return;
    }

    try {
      setLoading(true);
      await updateBankDetailsApi({
        upiId: form.upiId.trim().toLowerCase(),
        qrCodeUrl: form.qrCodeUrl,
      });
      toast.success("UPI details updated! Admin will verify.");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6 my-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold text-lg flex items-center gap-2">
            <FiSmartphone className="text-primary" /> UPI Details
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg">
            <FiX />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 mb-4 text-xs text-blue-700">
          💡 UPI se payout fast hota hai. Admin verify karne ke baad active
          hoga.
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              UPI ID *
            </label>
            <input
              type="text"
              value={form.upiId}
              onChange={(e) =>
                setForm({ ...form, upiId: e.target.value.toLowerCase().trim() })
              }
              placeholder="yourname@paytm"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
            <p className="text-[10px] text-muted mt-1">
              e.g. 9876543210@paytm, name@ybl, name@okaxis
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              UPI QR Code URL (Optional)
            </label>
            <input
              type="text"
              value={form.qrCodeUrl}
              onChange={(e) =>
                setForm({ ...form, qrCodeUrl: e.target.value })
              }
              placeholder="https://..."
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
            <p className="text-[10px] text-muted mt-1">
              Cloudinary upload ka URL (optional)
            </p>
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
            disabled={loading || !form.upiId.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50"
          >
            <FiSave /> {loading ? "Saving..." : "Save UPI"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Wallet;