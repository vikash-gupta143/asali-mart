import { useState, useEffect } from "react";
import {
  FiMapPin, FiPhone, FiShoppingBag, FiSave,
  FiNavigation, FiEdit2, FiCheck, FiX, FiExternalLink,
  FiFileText, FiCreditCard, FiUpload, FiUser, FiClock,
  FiAlertCircle, FiCheckCircle, FiXCircle,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  fetchMyShop,
  createShopApi,
  updateShopApi,
} from "../../services/shopService";

const categoriesList = [
  "Electronics", "Fashion", "Grocery", "Home",
  "Beauty", "Sports", "Toys", "Books", "General", "Other",
];

const MyShop = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1); // 1: Basic, 2: Legal, 3: Bank, 4: Documents

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "General",
    phone: user?.phone || "",
    email: user?.email || "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    longitude: 0,
    latitude: 0,
    // Legal
    gstNumber: "",
    panNumber: "",
    aadhaarNumber: "",
    shopLicenseNumber: "",
    registrationNumber: "",
    fssaiNumber: "",
    // Bank
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    // Timing
    openingTime: "",
    closingTime: "",
  });

  const [files, setFiles] = useState({
    gstCertificate: null,
    panCard: null,
    aadhaarCard: null,
    shopLicense: null,
    shopFrontPhoto: null,
    insideShopPhoto: null,
    ownerPhoto: null,
    bankCheque: null,
  });

  // Load shop
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchMyShop();
        setShop(data.shop);
      } catch (err) {
        setShop(null);
        setEditing(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Sync form
  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name || "",
        description: shop.description || "",
        category: shop.category || "General",
        phone: shop.phone || user?.phone || "",
        email: shop.email || user?.email || "",
        line1: shop.address?.line1 || "",
        city: shop.address?.city || "",
        state: shop.address?.state || "",
        pincode: shop.address?.pincode || "",
        landmark: shop.address?.landmark || "",
        longitude: shop.location?.coordinates?.[0] || 0,
        latitude: shop.location?.coordinates?.[1] || 0,
        gstNumber: shop.legal?.gstNumber || "",
        panNumber: shop.legal?.panNumber || "",
        aadhaarNumber: shop.legal?.aadhaarNumber || "",
        shopLicenseNumber: shop.legal?.shopLicenseNumber || "",
        registrationNumber: shop.legal?.registrationNumber || "",
        fssaiNumber: shop.legal?.fssaiNumber || "",
        accountHolderName: shop.bank?.accountHolderName || "",
        accountNumber: shop.bank?.accountNumber || "",
        ifscCode: shop.bank?.ifscCode || "",
        bankName: shop.bank?.bankName || "",
        branchName: shop.bank?.branchName || "",
        openingTime: shop.openingTime || "",
        closingTime: shop.closingTime || "",
      });
    }
  }, [shop]);

  const handleFile = (key, file) => {
    setFiles({ ...files, [key]: file });
  };

  // Detect location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        let city = form.city;
        let state = form.state;
        let pincode = form.pincode;
        let line1 = form.line1;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          city = addr.city || addr.town || addr.village || city;
          state = addr.state || state;
          pincode = addr.postcode || pincode;
          line1 = addr.road || addr.suburb || addr.neighbourhood || line1;
        } catch (err) {
          console.error("Geocoding failed");
        }

        setForm({
          ...form,
          line1,
          city,
          state,
          pincode,
          longitude: lng,
          latitude: lat,
        });
        setLocating(false);
      },
      () => {
        alert("Location permission required");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate
    if (!form.name || !form.phone) {
      setError("Shop name and phone required");
      setStep(1);
      return;
    }
    if (!form.line1 || !form.city || !form.pincode) {
      setError("Full address required");
      setStep(1);
      return;
    }
    if (!form.longitude || !form.latitude) {
      setError("Location set karein (Use Current Location)");
      setStep(1);
      return;
    }

    try {
      setSaving(true);

      // Build FormData
      const formData = new FormData();

      // All text fields
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      // Files
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          formData.append(key, files[key]);
        }
      });

      if (shop) {
        const data = await updateShopApi(shop._id, formData);
        setShop(data.shop);
        setSuccess("Shop updated! Admin will re-verify.");
      } else {
        const data = await createShopApi(formData);
        setShop(data.shop);
        setSuccess(
          "Shop submitted! Admin will verify in 24-48 hours."
        );
      }

      setEditing(false);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save shop");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-muted">Loading shop...</div>;
  }

  // ============ STATUS BADGE ============
  const StatusBadge = ({ status }) => {
    const config = {
      PENDING: {
        icon: FiClock,
        color: "text-yellow-700 bg-yellow-50 border-yellow-200",
        text: "⏳ Pending Verification",
        desc: "Admin verify karega 24-48 hours me",
      },
      APPROVED: {
        icon: FiCheckCircle,
        color: "text-green-700 bg-green-50 border-green-200",
        text: "✅ Approved & Live",
        desc: "Aapki shop customers ko dikh rahi hai",
      },
      REJECTED: {
        icon: FiXCircle,
        color: "text-red-700 bg-red-50 border-red-200",
        text: "❌ Rejected",
        desc: "Re-submit karein",
      },
      SUSPENDED: {
        icon: FiAlertCircle,
        color: "text-gray-700 bg-gray-50 border-gray-200",
        text: "⚠️ Suspended",
        desc: "Contact support",
      },
    };

    const c = config[status] || config.PENDING;
    const Icon = c.icon;

    return (
      <div className={`p-4 rounded-xl border-2 ${c.color}`}>
        <div className="flex items-center gap-2">
          <Icon className="text-xl" />
          <div>
            <p className="font-bold text-sm">{c.text}</p>
            <p className="text-xs opacity-80">{c.desc}</p>
          </div>
        </div>
      </div>
    );
  };

  // ============ VIEW MODE ============
  if (shop && !editing) {
    return (
      <div className="max-w-3xl space-y-5">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl">My Shop</h1>
            <p className="text-sm text-muted">Shop details & verification status</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            <FiEdit2 /> Edit Shop
          </button>
        </div>

        {/* Status */}
        <StatusBadge status={shop.status} />

        {shop.status === "REJECTED" && shop.rejectionReason && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs font-bold text-red-700 mb-1">Rejection Reason:</p>
            <p className="text-sm text-red-900">{shop.rejectionReason}</p>
          </div>
        )}

        {/* Shop Info Card */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary to-primary-light" />
          <div className="p-6 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-card border-4 border-white flex items-center justify-center text-primary font-bold text-3xl mb-3">
              {shop.name?.[0]?.toUpperCase()}
            </div>
            <h2 className="font-heading font-bold text-xl">{shop.name}</h2>
            <p className="text-sm text-muted mb-4">{shop.description || "—"}</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted">
                <FiShoppingBag className="text-primary" /> {shop.category}
              </div>
              <div className="flex items-center gap-2 text-muted">
                <FiPhone className="text-primary" /> {shop.phone}
              </div>
              <div className="flex items-center gap-2 text-muted">
                <FiMapPin className="text-primary" />
                {shop.address?.line1}, {shop.address?.city},{" "}
                {shop.address?.state} - {shop.address?.pincode}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted">GST Number</p>
                <p className="font-medium">{shop.legal?.gstNumber || "—"}</p>
              </div>
              <div>
                <p className="text-muted">PAN Number</p>
                <p className="font-medium">{shop.legal?.panNumber || "—"}</p>
              </div>
            </div>

            {/* Documents Preview */}
            {(shop.documents?.shopFrontPhoto || shop.documents?.panCard) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-bold mb-2">Uploaded Documents</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(shop.documents || {}).map(([key, url]) =>
                    url ? (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden bg-bg border border-gray-200"
                      >
                        <img
                          src={url}
                          alt={key}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {shop.status === "APPROVED" && (
              <Link
                to={`/shops/${shop._id}`}
                target="_blank"
                className="inline-flex items-center gap-2 mt-4 text-primary text-sm font-semibold hover:underline"
              >
                <FiExternalLink /> View Public Shop Page
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============ CREATE / EDIT FORM ============
  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl">
          {shop ? "Edit Shop" : "Create Your Shop"}
        </h1>
        <p className="text-sm text-muted">
          {shop
            ? "Details update karein — admin re-verify karega"
            : "Complete KYC for admin verification"}
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm flex items-center gap-2">
          <FiCheck /> {success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <FiX /> {error}
        </div>
      )}

      {/* Steps */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: 1, name: "Basic", icon: FiShoppingBag },
          { id: 2, name: "Legal", icon: FiFileText },
          { id: 3, name: "Bank", icon: FiCreditCard },
          { id: 4, name: "Documents", icon: FiUpload },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1 min-w-[100px]">
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                step === s.id
                  ? "bg-primary text-white"
                  : "bg-white text-muted hover:bg-bg"
              }`}
            >
              <s.icon /> {s.name}
            </button>
            {i < 3 && <div className="flex-1 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-5">
        {/* STEP 1 — Basic */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
              <FiShoppingBag className="text-primary" /> Shop Basics
            </h3>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Shop Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Tech World"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Description
              </label>
              <textarea
                rows="2"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="e.g. Best electronics shop in town"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Shop Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="9876543210"
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Opening Time</label>
                <input
                  type="time"
                  value={form.openingTime}
                  onChange={(e) =>
                    setForm({ ...form, openingTime: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Closing Time</label>
                <input
                  type="time"
                  value={form.closingTime}
                  onChange={(e) =>
                    setForm({ ...form, closingTime: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* Address */}
            <h4 className="font-semibold text-sm pt-2 flex items-center gap-2">
              <FiMapPin className="text-primary" /> Address
            </h4>

            <input
              type="text"
              required
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              placeholder="Street / Area *"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="City *"
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="State"
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
              <input
                type="text"
                required
                value={form.pincode}
                onChange={(e) =>
                  setForm({ ...form, pincode: e.target.value })
                }
                placeholder="Pincode *"
                className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
              />
            </div>

            {/* Location */}
            <div
              className={`p-4 rounded-xl border-2 border-dashed ${
                form.longitude && form.latitude
                  ? "bg-green-50 border-green-300"
                  : "bg-yellow-50 border-yellow-300"
              }`}
            >
              {form.longitude && form.latitude ? (
                <>
                  <p className="text-sm text-green-700 font-semibold mb-1">
                    ✅ Location Set
                  </p>
                  <p className="text-xs text-green-600 mb-3">
                    Lat: {form.latitude.toFixed(6)}, Lng: {form.longitude.toFixed(6)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-yellow-700 font-semibold mb-1">
                    ⚠️ Location Zaroori Hai
                  </p>
                  <p className="text-xs text-yellow-600 mb-3">
                    Customers nearby search ke liye
                  </p>
                </>
              )}

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50"
              >
                {locating ? (
                  <>
                    <FiNavigation className="animate-spin" /> Detecting...
                  </>
                ) : (
                  <>
                    <FiNavigation /> Use Current Location
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold"
            >
              Next: Legal Info →
            </button>
          </div>
        )}

        {/* STEP 2 — Legal */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
              <FiFileText className="text-primary" /> Legal / KYC Info
            </h3>

            <p className="text-xs text-muted">
              Ye details admin verification ke liye chahiye. Sahi info dein.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  GST Number
                </label>
                <input
                  type="text"
                  value={form.gstNumber}
                  onChange={(e) =>
                    setForm({ ...form, gstNumber: e.target.value.toUpperCase() })
                  }
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm uppercase"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={form.panNumber}
                  onChange={(e) =>
                    setForm({ ...form, panNumber: e.target.value.toUpperCase() })
                  }
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={form.aadhaarNumber}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      aadhaarNumber: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="123456789012"
                  maxLength={12}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Shop License Number
                </label>
                <input
                  type="text"
                  value={form.shopLicenseNumber}
                  onChange={(e) =>
                    setForm({ ...form, shopLicenseNumber: e.target.value })
                  }
                  placeholder="Shop license no."
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Business Registration No.
                </label>
                <input
                  type="text"
                  value={form.registrationNumber}
                  onChange={(e) =>
                    setForm({ ...form, registrationNumber: e.target.value })
                  }
                  placeholder="Registration no."
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  FSSAI Number <span className="text-muted">(Food shops)</span>
                </label>
                <input
                  type="text"
                  value={form.fssaiNumber}
                  onChange={(e) =>
                    setForm({ ...form, fssaiNumber: e.target.value })
                  }
                  placeholder="FSSAI license"
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold"
              >
                Next: Bank Details →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Bank */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
              <FiCreditCard className="text-primary" /> Bank Details
            </h3>

            <p className="text-xs text-muted">
              Payment settlement ke liye. Ye details verified hongi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="As per bank"
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
                  placeholder="Account number"
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">IFSC Code *</label>
                <input
                  type="text"
                  value={form.ifscCode}
                  onChange={(e) =>
                    setForm({ ...form, ifscCode: e.target.value.toUpperCase() })
                  }
                  placeholder="SBIN0001234"
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm uppercase"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bank Name</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) =>
                    setForm({ ...form, bankName: e.target.value })
                  }
                  placeholder="e.g. SBI"
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
                  placeholder="Branch name"
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold"
              >
                Next: Documents →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Documents */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
              <FiUpload className="text-primary" /> Upload Documents
            </h3>

            <p className="text-xs text-muted">
              Saaf photos ya PDF upload karein. Max 5MB each.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FileUpload
                label="GST Certificate"
                file={files.gstCertificate}
                onChange={(f) => handleFile("gstCertificate", f)}
              />
              <FileUpload
                label="PAN Card"
                file={files.panCard}
                onChange={(f) => handleFile("panCard", f)}
              />
              <FileUpload
                label="Aadhaar Card"
                file={files.aadhaarCard}
                onChange={(f) => handleFile("aadhaarCard", f)}
              />
              <FileUpload
                label="Shop License"
                file={files.shopLicense}
                onChange={(f) => handleFile("shopLicense", f)}
              />
              <FileUpload
                label="Shop Front Photo"
                file={files.shopFrontPhoto}
                onChange={(f) => handleFile("shopFrontPhoto", f)}
              />
              <FileUpload
                label="Inside Shop Photo"
                file={files.insideShopPhoto}
                onChange={(f) => handleFile("insideShopPhoto", f)}
              />
              <FileUpload
                label="Owner Photo"
                file={files.ownerPhoto}
                onChange={(f) => handleFile("ownerPhoto", f)}
              />
              <FileUpload
                label="Bank Cheque"
                file={files.bankCheque}
                onChange={(f) => handleFile("bankCheque", f)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
              >
                <FiSave />{" "}
                {saving
                  ? "Submitting..."
                  : shop
                  ? "Update Shop"
                  : "Submit for Verification"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

// ============ File Upload Component ============
const FileUpload = ({ label, file, onChange }) => (
  <div>
    <p className="text-xs font-medium mb-1">{label}</p>
    {file ? (
      <div className="relative rounded-xl overflow-hidden border-2 border-accent bg-green-50 p-3 text-center">
        <FiCheck className="text-accent text-2xl mx-auto mb-1" />
        <p className="text-[10px] text-accent font-semibold truncate">
          {file.name}
        </p>
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
        <p className="text-[10px] text-muted">Upload</p>
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

export default MyShop;