import { useState, useEffect } from "react";
import { FiSave, FiUpload } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";

const AdminSettings = () => {
  const [form, setForm] = useState({
    platformUpiId: "",
    platformQrCode: "",
    platformName: "AsaliMart",
    supportEmail: "",
    supportPhone: "",
    commissionRate: 5,
    deliveryCommissionRate: 20,
    minPayout: 500,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/settings");
        setForm(res.data.settings || form);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put("/settings", form);
      toast.success("Settings saved!");
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="font-heading font-bold text-2xl">⚙️ Platform Settings</h1>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-heading font-bold mb-4">🏦 Payment Settings</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Platform UPI ID *
            </label>
            <input
              type="text"
              value={form.platformUpiId}
              onChange={(e) => setForm({ ...form, platformUpiId: e.target.value })}
              placeholder="asalimart@upi"
              className="w-full p-3 rounded-xl border outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Platform QR Code URL
            </label>
            <input
              type="text"
              value={form.platformQrCode}
              onChange={(e) => setForm({ ...form, platformQrCode: e.target.value })}
              placeholder="https://cloudinary.com/..."
              className="w-full p-3 rounded-xl border outline-none focus:border-primary text-sm"
            />
            <p className="text-[10px] text-muted mt-1">
              Cloudinary upload ka URL
            </p>
          </div>

          {form.platformQrCode && (
            <div className="flex items-center gap-3">
              <img
                src={form.platformQrCode}
                alt="QR"
                className="w-24 h-24 rounded-xl border"
              />
              <p className="text-xs text-muted">QR Preview</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5">
        <h3 className="font-heading font-bold mb-4">💰 Commission Rates</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Seller Commission (%)
            </label>
            <input
              type="number"
              value={form.commissionRate}
              onChange={(e) =>
                setForm({ ...form, commissionRate: Number(e.target.value) })
              }
              className="w-full p-3 rounded-xl border outline-none focus:border-primary text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Delivery Commission (%)
            </label>
            <input
              type="number"
              value={form.deliveryCommissionRate}
              onChange={(e) =>
                setForm({
                  ...form,
                  deliveryCommissionRate: Number(e.target.value),
                })
              }
              className="w-full p-3 rounded-xl border outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium mb-1 block">
            Minimum Payout (₹)
          </label>
          <input
            type="number"
            value={form.minPayout}
            onChange={(e) =>
              setForm({ ...form, minPayout: Number(e.target.value) })
            }
            className="w-full p-3 rounded-xl border outline-none focus:border-primary text-sm"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <FiSave /> {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
};

export default AdminSettings;