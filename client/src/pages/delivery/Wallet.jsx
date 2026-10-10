import { useState, useEffect } from "react";
import {
  FiDollarSign, FiArrowUpRight, FiClock, FiCheck, FiX,
  FiCreditCard, FiEdit2, FiSave, FiAlertCircle, FiSmartphone,
  FiTrendingUp, FiPackage,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  fetchDeliveryWallet,
  updateDeliveryBankApi,
  requestDeliveryWithdrawApi,
  settleCashApi,
} from "../../services/deliveryService";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  PAID: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const DeliveryWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [upiDetails, setUpiDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showBank, setShowBank] = useState(false);
  const [showUpi, setShowUpi] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showSettle, setShowSettle] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchDeliveryWallet();
      setWallet(data.wallet);
      setBankDetails(data.bankDetails || {});
      setUpiDetails(data.upiDetails || {});
      setTransactions(data.transactions || []);
      setPayouts(data.payouts || []);
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

  if (loading) return <div className="text-center py-10 text-muted">Loading...</div>;

  const bankOk = bankDetails?.accountNumber && bankDetails?.isVerified;
  const upiOk = upiDetails?.upiId && upiDetails?.isVerified;

  const canWithdraw =
    wallet?.balance >= 500 &&
    (bankOk || upiOk) &&
    !payouts.some((p) => ["PENDING", "APPROVED", "PROCESSING"].includes(p.status));

  const canSettle = wallet?.cashInHand > 0;

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="font-heading font-bold text-2xl">💰 Wallet</h1>
        <p className="text-sm text-muted">Earnings, cash, aur payouts</p>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Wallet Balance */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <FiDollarSign />
            <p className="text-xs uppercase tracking-wider font-semibold">
              Wallet Balance
            </p>
          </div>
          <p className="font-heading font-bold text-3xl mb-3">
            ₹{(wallet?.balance || 0).toLocaleString()}
          </p>
          <div className="flex justify-between text-xs opacity-90">
            <span>Earned: ₹{(wallet?.totalEarned || 0).toLocaleString()}</span>
            <span>Withdrawn: ₹{(wallet?.totalWithdrawn || 0).toLocaleString()}</span>
          </div>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={!canWithdraw}
            className="w-full mt-3 py-2.5 rounded-xl bg-white text-green-700 font-semibold text-sm disabled:opacity-50"
          >
            Withdraw
          </button>
        </div>

        {/* Cash in Hand */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <FiPackage />
            <p className="text-xs uppercase tracking-wider font-semibold">
              Cash in Hand
            </p>
          </div>
          <p className="font-heading font-bold text-3xl mb-3">
            ₹{(wallet?.cashInHand || 0).toLocaleString()}
          </p>
          <p className="text-xs opacity-90">
            ⚠️ Company ko dena: ₹{(wallet?.platformDues || 0).toLocaleString()}
          </p>
          <button
            onClick={() => setShowSettle(true)}
            disabled={!canSettle}
            className="w-full mt-3 py-2.5 rounded-xl bg-white text-orange-700 font-semibold text-sm disabled:opacity-50"
          >
            Settle Cash
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-card p-4 text-center">
          <p className="text-xs text-muted">Deliveries</p>
          <p className="font-bold text-xl">{wallet?.totalDeliveries || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4 text-center">
          <p className="text-xs text-muted">Bank</p>
          <p className="font-bold text-xl">{bankOk ? "✅" : "❌"}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4 text-center">
          <p className="text-xs text-muted">UPI</p>
          <p className="font-bold text-xl">{upiOk ? "✅" : "❌"}</p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading font-bold flex items-center gap-2">
            <FiCreditCard className="text-primary" /> Bank
          </h3>
          <button onClick={() => setShowBank(true)} className="text-xs text-primary font-semibold">
            <FiEdit2 /> {bankDetails?.accountNumber ? "Update" : "Add"}
          </button>
        </div>
        {bankDetails?.accountNumber ? (
          <>
            <p className="text-sm font-medium">{bankDetails.accountHolderName}</p>
            <p className="text-xs text-muted">
              XXXX-{bankDetails.accountNumber?.slice(-4)} • {bankDetails.ifscCode}
            </p>
            <p className="text-xs mt-2">
              {bankDetails.isVerified ? (
                <span className="text-green-600">✅ Verified</span>
              ) : (
                <span className="text-yellow-600">⏳ Pending</span>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">Bank details add nahi ki</p>
        )}
      </div>

      {/* UPI Details */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading font-bold flex items-center gap-2">
            <FiSmartphone className="text-primary" /> UPI
          </h3>
          <button onClick={() => setShowUpi(true)} className="text-xs text-primary font-semibold">
            <FiEdit2 /> {upiDetails?.upiId ? "Update" : "Add"}
          </button>
        </div>
        {upiDetails?.upiId ? (
          <>
            <p className="font-mono text-sm font-bold">{upiDetails.upiId}</p>
            <p className="text-xs mt-2">
              {upiDetails.isVerified ? (
                <span className="text-green-600">✅ Verified</span>
              ) : (
                <span className="text-yellow-600">⏳ Pending</span>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">UPI add nahi ki</p>
        )}
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
          <FiTrendingUp className="text-primary" /> Payout History
        </h3>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">No payouts</p>
        ) : (
          <div className="space-y-2">
            {payouts.map((p) => (
              <div key={p._id} className="flex justify-between items-center p-3 rounded-lg bg-bg">
                <div>
                  <p className="font-bold text-sm">₹{p.amount}</p>
                  <p className="text-[10px] text-muted">
                    {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    {p.referenceId && ` • UTR: ${p.referenceId}`}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusColors[p.status]}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-heading font-bold mb-3">📋 Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">No transactions</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map((t, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-bg">
                <div>
                  <p className="text-xs font-semibold">{t.description || t.type}</p>
                  <p className="text-[10px] text-muted">
                    {new Date(t.at).toLocaleString("en-IN")}
                  </p>
                </div>
                <p className={`font-bold text-sm ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                  {t.amount > 0 ? "+" : ""}₹{Math.abs(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showBank && (
        <BankModal
          bankDetails={bankDetails}
          onClose={() => setShowBank(false)}
          onSuccess={() => { setShowBank(false); load(); }}
        />
      )}
      {showUpi && (
        <UpiModal
          upiDetails={upiDetails}
          onClose={() => setShowUpi(false)}
          onSuccess={() => { setShowUpi(false); load(); }}
        />
      )}
      {showWithdraw && (
        <WithdrawModal
          wallet={wallet}
          bankDetails={bankDetails}
          upiDetails={upiDetails}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => { setShowWithdraw(false); load(); }}
        />
      )}
      {showSettle && (
        <SettleCashModal
          wallet={wallet}
          onClose={() => setShowSettle(false)}
          onSuccess={() => { setShowSettle(false); load(); }}
        />
      )}
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
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.accountHolderName || !form.accountNumber || !form.ifscCode) {
      toast.error("Sab fields zaroori hain");
      return;
    }
    try {
      setLoading(true);
      await updateDeliveryBankApi(form);
      toast.success("Bank updated!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold text-lg">🏦 Bank Details</h3>
          <button onClick={onClose}><FiX /></button>
        </div>
        <div className="space-y-3 mb-4">
          <input placeholder="Account Holder *" value={form.accountHolderName}
            onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
            className="w-full p-3 rounded-xl border text-sm" />
          <input placeholder="Account Number *" value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            className="w-full p-3 rounded-xl border text-sm" />
          <input placeholder="IFSC *" value={form.ifscCode}
            onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
            className="w-full p-3 rounded-xl border text-sm" />
          <input placeholder="Bank Name" value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            className="w-full p-3 rounded-xl border text-sm" />
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50">
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

// ============================================
// UPI Modal
// ============================================
const UpiModal = ({ upiDetails, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    upiId: upiDetails?.upiId || "",
    qrCodeUrl: upiDetails?.qrCodeUrl || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.upiId || !form.upiId.includes("@")) {
      toast.error("Valid UPI ID");
      return;
    }
    try {
      setLoading(true);
      await updateDeliveryBankApi(form);
      toast.success("UPI updated!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold text-lg">📱 UPI Details</h3>
          <button onClick={onClose}><FiX /></button>
        </div>
        <div className="space-y-3 mb-4">
          <input placeholder="UPI ID (e.g. name@paytm) *" value={form.upiId}
            onChange={(e) => setForm({ ...form, upiId: e.target.value.toLowerCase().trim() })}
            className="w-full p-3 rounded-xl border text-sm" />
          <input placeholder="QR Code URL (optional)" value={form.qrCodeUrl}
            onChange={(e) => setForm({ ...form, qrCodeUrl: e.target.value })}
            className="w-full p-3 rounded-xl border text-sm" />
        </div>
        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50">
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

// ============================================
// Withdraw Modal
// ============================================
const WithdrawModal = ({ wallet, bankDetails, upiDetails, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(
    bankDetails?.isVerified ? "BANK" : upiDetails?.isVerified ? "UPI" : "BANK"
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const num = Number(amount);
    if (!num || num < 500) { toast.error("Minimum ₹500"); return; }
    if (num > wallet.balance) { toast.error("Insufficient balance"); return; }
    try {
      setLoading(true);
      await requestDeliveryWithdrawApi(num, method);
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
      <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold text-lg">💰 Withdraw</h3>
          <button onClick={onClose}><FiX /></button>
        </div>
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 mb-4">
          <p className="text-xs text-green-700">Available</p>
          <p className="font-bold text-2xl text-green-600">₹{wallet.balance}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {bankDetails?.isVerified && (
            <button onClick={() => setMethod("BANK")}
              className={`p-3 rounded-xl border-2 text-left ${method === "BANK" ? "border-primary bg-primary/5" : "border-gray-200"}`}>
              <FiCreditCard className="text-primary mb-1" />
              <p className="text-xs font-semibold">Bank</p>
            </button>
          )}
          {upiDetails?.isVerified && (
            <button onClick={() => setMethod("UPI")}
              className={`p-3 rounded-xl border-2 text-left ${method === "UPI" ? "border-primary bg-primary/5" : "border-gray-200"}`}>
              <FiSmartphone className="text-primary mb-1" />
              <p className="text-xs font-semibold">UPI</p>
            </button>
          )}
        </div>
        <input type="number" placeholder="Amount (min ₹500)" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 rounded-xl border mb-4 text-sm" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border font-semibold text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !amount}
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm disabled:opacity-50">
            {loading ? "Processing..." : "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Settle Cash Modal
// ============================================
const SettleCashModal = ({ wallet, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(wallet.cashInHand || 0);
  const [method, setMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || amount <= 0) { toast.error("Valid amount"); return; }
    if (amount > wallet.cashInHand) { toast.error("Cash in hand se zyada"); return; }
    try {
      setLoading(true);
      await settleCashApi(amount, method, reference);
      toast.success("Cash settled!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold text-lg">💵 Settle Cash</h3>
          <button onClick={onClose}><FiX /></button>
        </div>
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 mb-4">
          <p className="text-xs text-orange-700">Cash in Hand</p>
          <p className="font-bold text-2xl text-orange-600">₹{wallet.cashInHand}</p>
        </div>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full p-3 rounded-xl border mb-3 text-sm" />
        <select value={method} onChange={(e) => setMethod(e.target.value)}
          className="w-full p-3 rounded-xl border mb-3 text-sm">
          <option value="UPI">UPI</option>
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </select>
        <input placeholder="Reference / UTR (optional)" value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="w-full p-3 rounded-xl border mb-4 text-sm" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border font-semibold text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-orange-600 text-white font-semibold text-sm disabled:opacity-50">
            {loading ? "Processing..." : "Settle"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryWallet;