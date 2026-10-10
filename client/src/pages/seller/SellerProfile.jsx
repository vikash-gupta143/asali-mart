import { useState, useEffect } from "react";
import {
  FiUser, FiMail, FiPhone, FiShoppingBag,
  FiCreditCard, FiSmartphone, FiCheck, FiClock,
  FiArrowRight, FiEdit2,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchSellerWallet } from "../../services/sellerService";

const SellerProfile = () => {
  const { user } = useAuth();
  const [bankDetails, setBankDetails] = useState(null);
  const [upiDetails, setUpiDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSellerWallet();
        setBankDetails(data.bankDetails || {});
        setUpiDetails(data.upiDetails || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="font-heading font-bold text-2xl">Seller Profile</h1>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl">{user?.name}</h2>
            <p className="text-sm text-white/80">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white/20 text-xs font-semibold">
              SELLER
            </span>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl shadow-card p-5 space-y-3">
        <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
          <FiUser className="text-primary" /> Personal Information
        </h3>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FiUser />
          </div>
          <div>
            <p className="text-xs text-muted">Name</p>
            <p className="text-sm font-medium">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FiMail />
          </div>
          <div>
            <p className="text-xs text-muted">Email</p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FiPhone />
          </div>
          <div>
            <p className="text-xs text-muted">Phone</p>
            <p className="text-sm font-medium">{user?.phone || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FiShoppingBag />
          </div>
          <div>
            <p className="text-xs text-muted">Role</p>
            <p className="text-sm font-medium">Seller</p>
          </div>
        </div>
      </div>

      {/* 🏦 Bank Details */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold flex items-center gap-2">
            <FiCreditCard className="text-primary" /> Bank Details
          </h3>
          <Link
            to="/seller/wallet"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <FiEdit2 /> {bankDetails?.accountNumber ? "Update" : "Add"}
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted text-center py-4">Loading...</p>
        ) : bankDetails?.accountNumber ? (
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
                  <FiCheck /> Verified
                </span>
              ) : (
                <span className="text-xs text-yellow-600 font-semibold flex items-center gap-1">
                  <FiClock /> Verification Pending
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <FiCreditCard className="text-3xl text-muted mx-auto mb-2" />
            <p className="text-sm text-muted mb-3">
              Bank details add karein
            </p>
            <Link
              to="/seller/wallet"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              Add Bank Details <FiArrowRight />
            </Link>
          </div>
        )}
      </div>

      {/* 📱 UPI Details */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-heading font-bold flex items-center gap-2">
            <FiSmartphone className="text-primary" /> UPI Details
          </h3>
          <Link
            to="/seller/wallet"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <FiEdit2 /> {upiDetails?.upiId ? "Update" : "Add"}
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted text-center py-4">Loading...</p>
        ) : upiDetails?.upiId ? (
          <>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-[10px] text-blue-600 uppercase mb-1">
                UPI ID
              </p>
              <p className="font-mono font-semibold text-blue-800">
                {upiDetails.upiId}
              </p>
            </div>

            {upiDetails.qrCodeUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={upiDetails.qrCodeUrl}
                  alt="UPI QR"
                  className="w-20 h-20 rounded-xl border border-gray-200 object-cover"
                />
                <p className="text-xs text-muted">
                  Aapka UPI QR code
                </p>
              </div>
            )}

            <div className="mt-3 pt-3 border-t flex items-center gap-2">
              {upiDetails.isVerified ? (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <FiCheck /> Verified
                </span>
              ) : (
                <span className="text-xs text-yellow-600 font-semibold flex items-center gap-1">
                  <FiClock /> Verification Pending
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <FiSmartphone className="text-3xl text-muted mx-auto mb-2" />
            <p className="text-sm text-muted mb-3">
              UPI ID add karein (payout ke liye)
            </p>
            <Link
              to="/seller/wallet"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              Add UPI Details <FiArrowRight />
            </Link>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-xs text-yellow-800">
          <b>ℹ️ Note:</b> Bank aur UPI details <b>Wallet page</b> se update
          kar sakte hain. Admin verify karne ke baad hi payout possible hai.
        </p>
      </div>
    </div>
  );
};

export default SellerProfile;