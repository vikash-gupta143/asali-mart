import { useState, useEffect } from "react";
import { FiCheck, FiX, FiSearch, FiImage } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";

const OrderVerification = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/orders/pending-payments");
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerify = async (id, action) => {
    if (!window.confirm(`${action} this payment?`)) return;
    try {
      await api.put(`/admin/orders/${id}/verify-payment`, { action });
      toast.success(`Payment ${action}ed`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl">💰 Payment Verification</h1>
        <p className="text-sm text-muted">
          Online payment orders verify karein
        </p>
      </div>

      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          placeholder="Search by order number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white shadow-card text-sm"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiImage className="text-5xl text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No pending payments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-card p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold">#{order.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {order.user?.name} • {order.user?.phone}
                  </p>
                </div>
                <p className="font-heading font-bold text-xl text-primary">
                  ₹{order.totalAmount}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 mb-3 text-xs">
                <p><b>UPI Transaction ID:</b> {order.paymentDetails?.transactionId || "—"}</p>
                <p className="mt-1"><b>Paid To:</b> {order.paymentDetails?.paidTo || "—"}</p>
              </div>

              {order.paymentDetails?.screenshot && (
                <div className="mb-3">
                  <p className="text-xs font-medium mb-2">Payment Screenshot:</p>
                  <img
                    src={order.paymentDetails.screenshot}
                    alt="Screenshot"
                    className="w-full max-w-xs rounded-xl border"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleVerify(order._id, "approve")}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <FiCheck /> Verify Payment
                </button>
                <button
                  onClick={() => handleVerify(order._id, "reject")}
                  className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <FiX /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderVerification;