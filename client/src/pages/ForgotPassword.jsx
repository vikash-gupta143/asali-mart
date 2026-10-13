import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiArrowLeft, FiCheck, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email daalein");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Valid email address daalein");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
      toast.success("Reset link bhej diya gaya! 📧");
    } catch (err) {
      setError(
        err.response?.data?.message || "Kuch problem aayi. Dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  };

  // Success State
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 text-green-500 flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-4xl" />
          </div>
          <h1 className="font-heading font-bold text-2xl mb-2">
            Email Sent! 📧
          </h1>
          <p className="text-sm text-muted mb-6">
            Aapke email <b className="text-dark">{email}</b> par password reset
            link bhej diya gaya hai.
            <br />
            <br />
            Link <b>15 minute</b> ke liye valid hai.
          </p>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 mb-6 text-left">
            <p className="text-[11px] text-blue-700 leading-relaxed">
              💡 <b>Tip:</b> Email nahi mila? <b>Spam</b> folder check karein
              ya <b>1 minute</b> baad dobara try karein.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
          >
            <FiArrowLeft /> Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-6"
        >
          <FiArrowLeft /> Back to Login
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <FiMail className="text-3xl text-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl mb-1">
            Forgot Password?
          </h1>
          <p className="text-sm text-muted">
            Email daalein, hum reset link bhejenge
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <FiAlertCircle /> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="your@email.com"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm transition"
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <FiMail /> Send Reset Link
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-muted text-center mt-6">
          Password yaad aa gaya?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Login karein
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;