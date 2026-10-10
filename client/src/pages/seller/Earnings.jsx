import { useState, useEffect } from "react";
import {
  FiDollarSign, FiTrendingUp, FiClock, FiCheckCircle,
  FiArrowRight, FiAlertCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import {
  fetchSellerEarnings,
  fetchSellerWallet,
  fetchMyPayouts,
} from "../../services/sellerService";

const SellerEarnings = () => {
  const [data, setData] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [earningsData, walletData, payoutsData] = await Promise.all([
        fetchSellerEarnings().catch(() => null),
        fetchSellerWallet().catch(() => null),
        fetchMyPayouts().catch(() => null),
      ]);

      if (earningsData) setData(earningsData);
      if (walletData) {
        setWallet(walletData.wallet);
        setBankDetails(walletData.bankDetails);
      }
      if (payoutsData) setPayouts(payoutsData.payouts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 text-muted">Loading earnings...</div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 text-danger">
        Failed to load earnings
      </div>
    );
  }

  const { earnings, recentOrders } = data;

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="font-heading font-bold text-2xl">💰 Earnings</h1>
        <p className="text-sm text-muted">Aapki kamai aur payout details</p>
      </div>

      {/* 💰 Wallet Card */}
      {wallet && (
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-card p-6 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <p className="text-xs opacity-90 uppercase tracking-wider mb-1">
                Available Balance
              </p>
              <p className="font-heading font-bold text-4xl">
                ₹{wallet.available?.toLocaleString() || 0}
              </p>
              <div className="flex gap-4 mt-3 text-xs opacity-90 flex-wrap">
                <span>
                  Pending: ₹{wallet.pending?.toLocaleString() || 0}
                </span>
                <span>
                  Total Earned: ₹{wallet.totalEarned?.toLocaleString() || 0}
                </span>
                <span>
                  Withdrawn: ₹{wallet.totalWithdrawn?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                to="/seller/wallet"
                className="px-6 py-3 rounded-xl bg-white text-green-600 font-bold text-sm hover:bg-gray-50 transition flex items-center gap-2"
              >
                💰 Withdraw Money <FiArrowRight />
              </Link>
              <Link
                to="/seller/wallet"
                className="px-6 py-2 rounded-xl bg-white/20 backdrop-blur text-white text-xs font-semibold hover:bg-white/30 transition text-center"
              >
                🏦 Manage Bank Details
              </Link>
            </div>
          </div>

          {/* Bank status */}
          {!bankDetails?.accountNumber && (
            <div className="mt-4 p-3 rounded-xl bg-white/20 backdrop-blur text-xs flex items-center gap-2">
              <FiAlertCircle /> Bank details add karein — withdraw ke liye
              zaroori hai
            </div>
          )}
          {bankDetails?.accountNumber && !bankDetails?.isVerified && (
            <div className="mt-4 p-3 rounded-xl bg-yellow-500/30 backdrop-blur text-xs flex items-center gap-2">
              <FiClock /> Bank verification pending — admin verify karega
            </div>
          )}
          {bankDetails?.isVerified && (
            <div className="mt-4 p-3 rounded-xl bg-white/20 backdrop-blur text-xs flex items-center gap-2">
              <FiCheckCircle /> Bank verified — XXXX-
              {bankDetails.accountNumber?.slice(-4)} •{" "}
              {bankDetails.bankName || bankDetails.ifscCode}
            </div>
          )}
        </div>
      )}

      {/* Earnings Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <FiDollarSign className="text-2xl mb-2 text-green-500" />
          <p className="text-xs text-muted">Total Earnings</p>
          <p className="font-heading font-bold text-2xl mt-1 text-dark">
            ₹{earnings.totalEarnings?.toLocaleString() || 0}
          </p>
          <p className="text-[10px] text-muted mt-1">
            {earnings.totalDeliveredOrders || 0} delivered
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <FiClock className="text-2xl mb-2 text-orange-500" />
          <p className="text-xs text-muted">Pending Payout</p>
          <p className="font-heading font-bold text-2xl mt-1 text-dark">
            ₹{earnings.pendingEarnings?.toLocaleString() || 0}
          </p>
          <p className="text-[10px] text-muted mt-1">
            {earnings.totalPendingOrders || 0} in progress
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <FiTrendingUp className="text-2xl mb-2 text-blue-500" />
          <p className="text-xs text-muted">This Month</p>
          <p className="font-heading font-bold text-2xl mt-1 text-dark">
            ₹{earnings.monthEarnings?.toLocaleString() || 0}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <FiCheckCircle className="text-2xl mb-2 text-purple-500" />
          <p className="text-xs text-muted">This Week</p>
          <p className="font-heading font-bold text-2xl mt-1 text-dark">
            ₹{earnings.weekEarnings?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-bold">📋 Payout History</h2>
            <Link
              to="/seller/wallet"
              className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline"
            >
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="space-y-2">
            {payouts.slice(0, 5).map((p) => (
              <div
                key={p._id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-bg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      p.status === "PAID"
                        ? "bg-green-50 text-green-600"
                        : p.status === "REJECTED"
                        ? "bg-red-50 text-red-600"
                        : "bg-yellow-50 text-yellow-600"
                    }`}
                  >
                    <FiDollarSign />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      ₹{p.amount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      {p.referenceId && ` • Ref: ${p.referenceId}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    p.status === "PAID"
                      ? "bg-green-100 text-green-700"
                      : p.status === "REJECTED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-heading font-bold mb-4">📊 Earnings Breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg bg-bg">
            <span className="text-sm text-muted">Total Product Sales</span>
            <span className="font-bold">
              ₹{earnings.totalItemsPrice?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-bg">
            <span className="text-sm text-muted">
              Platform Commission (5%)
            </span>
            <span className="font-bold text-red-600">
              -₹{earnings.totalCommission?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 border-2 border-green-200">
            <span className="font-bold text-sm">Your Total Earnings</span>
            <span className="font-bold text-green-600 text-lg">
              ₹{earnings.totalEarnings?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading font-bold">📦 Recent Delivered Orders</h2>
          <Link
            to="/seller/orders"
            className="text-primary text-sm font-semibold flex items-center gap-1"
          >
            View All <FiArrowRight />
          </Link>
        </div>

        {recentOrders?.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            Abhi tak koi order deliver nahi hua
          </p>
        ) : (
          <div className="space-y-2">
            {recentOrders?.map((order) => (
              <div
                key={order._id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-bg"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm">
                    #{order.orderNumber}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(order.deliveredAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <p className="font-bold text-green-600">
                  +₹{order.earning?.toLocaleString() || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-700">
          <b>ℹ️ Payout Info:</b> Withdraw request ke baad admin 2-3 working
          days me process karega. Minimum withdraw: <b>₹500</b>. Query?
          support@asalimart.com
        </p>
      </div>
    </div>
  );
};

export default SellerEarnings;