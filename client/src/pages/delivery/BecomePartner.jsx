import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiUpload, FiX, FiCheck, FiTruck,
  FiUser, FiCreditCard, FiMapPin, FiInfo,
  FiSmartphone,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import {
  registerDeliveryPartnerApi,
  fetchMyApplication,
} from "../../services/deliveryPartnerService";

const BecomePartner = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState(null);
  const [checking, setChecking] = useState(true);

  const [form, setForm] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    dateOfBirth: "",
    gender: "MALE",
    aadhaarNumber: "",
    panNumber: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",
    bankName: "",
    upiId: "", // 🆕
    vehicleType: "BIKE",
    vehicleNumber: "",
    vehicleModel: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [files, setFiles] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    selfie: null,
    rcDocument: null,
    upiQr: null, // 🆕
  });

  // Check existing application
  useEffect(() => {
    if (!isAuthenticated) return;
    const check = async () => {
      try {
        const data = await fetchMyApplication();
        setExisting(data.partner);
      } catch (err) {
        // No application yet
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [isAuthenticated]);

  const handleFile = (key, file) => {
    setFiles({ ...files, [key]: file });
  };

  const handleSubmit = async () => {
    setError("");

    if (
      !form.fullName ||
      !form.phone ||
      !form.aadhaarNumber ||
      !form.panNumber ||
      !form.accountNumber ||
      !form.ifscCode
    ) {
      setError("Please fill all required fields");
      return;
    }

    // 🆕 UPI validation
    if (!form.upiId || !form.upiId.includes("@")) {
      setError("Valid UPI ID daalein (e.g. name@paytm)");
      return;
    }

    if (!files.aadhaarFront || !files.aadhaarBack || !files.panCard || !files.selfie) {
      setError("Please upload all required documents");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      Object.keys(files).forEach((key) => {
        if (files[key]) formData.append(key, files[key]);
      });

      const data = await registerDeliveryPartnerApi(formData);

      navigate("/delivery/status");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="font-heading font-bold text-2xl mb-2">Login Required</h1>
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Login here
        </Link>
      </div>
    );
  }

  if (checking) {
    return <div className="container-custom py-20 text-center text-muted">Loading...</div>;
  }

  if (existing) {
    return (
      <div className="container-custom py-10 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-card p-6 text-center">
          <FiInfo className="text-4xl text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-2xl mb-2">
            Application Already Submitted
          </h1>
          <p className="text-sm text-muted mb-4">
            Status:{" "}
            <span
              className={`font-semibold ${
                existing.status === "APPROVED"
                  ? "text-accent"
                  : existing.status === "REJECTED"
                  ? "text-danger"
                  : "text-yellow-600"
              }`}
            >
              {existing.status}
            </span>
          </p>
          <Link
            to="/delivery/status"
            className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold"
          >
            View Status
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-6 max-w-3xl">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <FiTruck className="text-2xl" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">Become a Delivery Partner</h1>
            <p className="text-white/80 text-sm">
              Earn ₹20,000-₹40,000/month by delivering orders
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-6">
        {["Personal", "Documents", "Bank & Vehicle"].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > i + 1
                  ? "bg-accent text-white"
                  : step === i + 1
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-muted"
              }`}
            >
              {step > i + 1 ? <FiCheck /> : i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden sm:block ${
                step >= i + 1 ? "text-dark" : "text-muted"
              }`}
            >
              {s}
            </span>
            {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-card p-6">
        {/* STEP 1 — Personal */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4">
              <FiUser className="text-primary" /> Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Full Name *"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <input
                placeholder="Phone *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <input
                type="date"
                placeholder="Date of Birth"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {["MALE", "FEMALE", "OTHER"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, gender: g })}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                      form.gender === g
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-muted"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2 — Documents */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4">
              <FiCreditCard className="text-primary" /> KYC Documents
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Aadhaar Number (12 digits) *"
                maxLength={12}
                value={form.aadhaarNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    aadhaarNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <input
                placeholder="PAN Number (ABCDE1234F) *"
                maxLength={10}
                value={form.panNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    panNumber: e.target.value.toUpperCase(),
                  })
                }
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-2 gap-3">
              <FileUpload
                label="Aadhaar Front *"
                file={files.aadhaarFront}
                onChange={(f) => handleFile("aadhaarFront", f)}
              />
              <FileUpload
                label="Aadhaar Back *"
                file={files.aadhaarBack}
                onChange={(f) => handleFile("aadhaarBack", f)}
              />
              <FileUpload
                label="PAN Card *"
                file={files.panCard}
                onChange={(f) => handleFile("panCard", f)}
              />
              <FileUpload
                label="Selfie *"
                file={files.selfie}
                onChange={(f) => handleFile("selfie", f)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Bank, UPI & Vehicle */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2 mb-4">
              <FiMapPin className="text-primary" /> Bank, UPI & Vehicle Details
            </h2>

            {/* 🏦 Bank Details */}
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                🏦 Bank Account
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Bank Account Number *"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
                <input
                  placeholder="IFSC Code *"
                  value={form.ifscCode}
                  onChange={(e) =>
                    setForm({ ...form, ifscCode: e.target.value.toUpperCase() })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
                <input
                  placeholder="Account Holder Name"
                  value={form.accountHolderName}
                  onChange={(e) =>
                    setForm({ ...form, accountHolderName: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
                <input
                  placeholder="Bank Name"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* 🆕 UPI Details */}
            <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-800">
                <FiSmartphone /> UPI Details (Payout ke liye zaroori)
              </p>

              <input
                placeholder="UPI ID * (e.g. name@paytm, name@ybl)"
                value={form.upiId}
                onChange={(e) =>
                  setForm({ ...form, upiId: e.target.value.toLowerCase().trim() })
                }
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm mb-3"
              />

              <div>
                <p className="text-xs font-medium mb-1 text-blue-800">
                  UPI QR Code (Optional)
                </p>
                <FileUpload
                  label=""
                  file={files.upiQr}
                  onChange={(f) => handleFile("upiQr", f)}
                />
              </div>

              <p className="text-[10px] text-blue-700 mt-2">
                💡 Aapka payout isi UPI pe bheja jayega. Verify hone ke baad hi
                active hoga.
              </p>
            </div>

            {/* 🚗 Vehicle */}
            <div>
              <p className="text-sm font-semibold mb-2">🚗 Vehicle Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={form.vehicleType}
                  onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                >
                  <option value="BIKE">Bike</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="CYCLE">Cycle</option>
                  <option value="CAR">Car</option>
                  <option value="WALK">Walk</option>
                </select>
                <input
                  placeholder="Vehicle Number"
                  value={form.vehicleNumber}
                  onChange={(e) =>
                    setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* Address */}
            <h3 className="font-semibold text-sm pt-2">📍 Address</h3>
            <input
              placeholder="Address Line"
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <input
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <input
                placeholder="Pincode"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// File Upload Component
const FileUpload = ({ label, file, onChange }) => (
  <div>
    {label && <p className="text-xs font-medium mb-1">{label}</p>}
    {file ? (
      <div className="relative rounded-xl overflow-hidden border-2 border-accent bg-green-50 p-3 text-center">
        <FiCheck className="text-accent text-2xl mx-auto mb-1" />
        <p className="text-[10px] text-accent font-semibold truncate">{file.name}</p>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-danger text-white flex items-center justify-center"
        >
          <FiX className="text-xs" />
        </button>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary transition">
        <FiUpload className="text-muted text-xl mb-1" />
        <p className="text-[10px] text-muted">Choose file</p>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => onChange(e.target.files[0])}
          className="hidden"
        />
      </label>
    )}
  </div>
);

export default BecomePartner;