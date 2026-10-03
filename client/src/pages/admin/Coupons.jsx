import { useState, useEffect } from "react";
import {
  FiPlus, FiTrash2, FiToggleLeft, FiToggleRight,
  FiTag, FiX, FiSave,
} from "react-icons/fi";
import {
  fetchAllCoupons,
  createCouponApi,
  toggleCouponApi,
  deleteCouponApi,
} from "../../services/couponService";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscount: "",
    minOrderValue: "0",
    validUntil: "",
    usageLimit: "100",
    perUserLimit: "1",
  });

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAllCoupons();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setError("");
    if (!form.code || !form.discountValue || !form.validUntil) {
      setError("Code, discount value, and valid until are required");
      return;
    }

    try {
      setSaving(true);
      await createCouponApi({
        ...form,
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minOrderValue: Number(form.minOrderValue),
        usageLimit: Number(form.usageLimit),
        perUserLimit: Number(form.perUserLimit),
        validUntil: new Date(form.validUntil).toISOString(),
      });
      setShowModal(false);
      setForm({
        code: "",
        description: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        maxDiscount: "",
        minOrderValue: "0",
        validUntil: "",
        usageLimit: "100",
        perUserLimit: "1",
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleCouponApi(id);
      load();
    } catch (err) {
      alert("Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await deleteCouponApi(id);
      load();
    } catch (err) {
      alert("Failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl">Coupons</h1>
          <p className="text-sm text-muted">{coupons.length} coupons</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
        >
          <FiPlus /> Create Coupon
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiTag className="text-5xl text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No coupons created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((c) => (
            <div key={c._id} className="bg-white rounded-xl shadow-card p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-heading font-bold text-lg text-primary">
                    {c.code}
                  </p>
                  <p className="text-xs text-muted">{c.description}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    c.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p className="text-muted">Discount</p>
                  <p className="font-semibold">
                    {c.discountType === "PERCENTAGE"
                      ? `${c.discountValue}%`
                      : `₹${c.discountValue}`}
                    {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Min Order</p>
                  <p className="font-semibold">₹{c.minOrderValue}</p>
                </div>
                <div>
                  <p className="text-muted">Used</p>
                  <p className="font-semibold">
                    {c.usedCount}/{c.usageLimit}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Valid Till</p>
                  <p className="font-semibold">
                    {new Date(c.validUntil).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => handleToggle(c._id)}
                  className={`p-2 rounded-lg ${
                    c.isActive
                      ? "bg-yellow-50 text-yellow-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {c.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                </button>
                <button
                  onClick={() => handleDelete(c._id)}
                  className="p-2 rounded-lg bg-red-50 text-danger"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-card w-full max-w-lg my-8">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-heading font-bold text-lg">Create Coupon</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-bg"
              >
                <FiX />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Code (ASALI40) *"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm col-span-2"
                />

                <input
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm col-span-2"
                />

                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({ ...form, discountType: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (₹)</option>
                </select>

                <input
                  type="number"
                  placeholder="Discount Value *"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />

                <input
                  type="number"
                  placeholder="Max Discount (optional)"
                  value={form.maxDiscount}
                  onChange={(e) =>
                    setForm({ ...form, maxDiscount: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />

                <input
                  type="number"
                  placeholder="Min Order Value"
                  value={form.minOrderValue}
                  onChange={(e) =>
                    setForm({ ...form, minOrderValue: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />

                <input
                  type="number"
                  placeholder="Usage Limit"
                  value={form.usageLimit}
                  onChange={(e) =>
                    setForm({ ...form, usageLimit: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />

                <input
                  type="number"
                  placeholder="Per User Limit"
                  value={form.perUserLimit}
                  onChange={(e) =>
                    setForm({ ...form, perUserLimit: e.target.value })
                  }
                  className="p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                />

                <div className="col-span-2">
                  <label className="text-xs text-muted mb-1 block">
                    Valid Until *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.validUntil}
                    onChange={(e) =>
                      setForm({ ...form, validUntil: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50"
              >
                <FiSave /> {saving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;