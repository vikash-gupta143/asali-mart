import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiLock,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
} from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../services/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password strength
  const getStrength = () => {
    if (password.length === 0) return { level: 0, text: "", color: "" };
    if (password.length < 6)
      return { level: 1, text: "Weak", color: "bg-red-500" };
    if (password.length < 10)
      return { level: 2, text: "Medium", color: "bg-yellow-500" };
    return { level: 3, text: "Strong", color: "bg-green-500" };
  };

  const strength = getStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!password || !confirmPassword) {
      setError("Dono passwords daalein");
      return;
    }

    if (password.length < 6) {
      setError("Password kam se kam 6 characters ka hona chahiye");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords match nahi kar rahe");
      return;
    }

    try {
      setLoading(true);
      const res = await api.put(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      });

      if (res.data.success) {
        // Auto-login
        localStorage.setItem("asali_token", res.data.token);
        localStorage.setItem("asali_user", JSON.stringify(res.data.user));

        setSuccess(true);
        toast.success("Password reset ho gaya! 🎉");

        // 2 sec baad home pe redirect
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Password reset nahi ho paya"
      );
    } finally {
      setLoading(false);
    }
  };

  // Success State
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 text-green-500 flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-4xl" />
          </div>
          <h1 className="font-heading font-bold text-2xl mb-2">
            Password Reset! 🎉
          </h1>
          <p className="text-sm text-muted mb-4">
            Aapka password successfully reset ho gaya.
            <br />
            Aapko home page pe le ja rahe hain...
          </p>
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
            <FiLock className="text-3xl text-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl mb-1">
            Set New Password
          </h1>
          <p className="text-sm text-muted">
            Naya password daalein — kam se kam 6 characters
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
          {/* New Password */}
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                className="w-full p-3 pr-10 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm transition"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Password Strength */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition ${
                        level <= strength.level ? strength.color : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted">
                  Strength:{" "}
                  <span
                    className={`font-semibold ${
                      strength.level === 1
                        ? "text-red-500"
                        : strength.level === 2
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {strength.text}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-semibold text-muted mb-1 block">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              className={`w-full p-3 rounded-xl border outline-none text-sm transition ${
                confirmPassword && password !== confirmPassword
                  ? "border-red-300 bg-red-50"
                  : confirmPassword && password === confirmPassword
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 focus:border-primary"
              }`}
              disabled={loading}
            />

            {confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                <FiAlertCircle /> Passwords match nahi kar rahe
              </p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                <FiCheck /> Passwords match kar rahe hain
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <FiLock /> Reset Password
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

export default ResetPassword;