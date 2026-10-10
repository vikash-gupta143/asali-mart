import { useState, useEffect } from "react";
import {
  FiSearch, FiCheckCircle, FiXCircle, FiEye,
  FiMapPin, FiPhone, FiFileText, FiX, FiShoppingBag,
} from "react-icons/fi";
import {
  adminFetchAllShops,
  verifyShopApi,
} from "../../services/shopService";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-gray-100 text-gray-700",
};

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);
  const [processing, setProcessing] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminFetchAllShops(status);
      setShops(data.shops || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const handleVerify = async (id, action) => {
    const confirmMsg =
      action === "approve"
        ? "Approve this shop?"
        : action === "reject"
        ? "Reject this shop?"
        : "Suspend this shop?";
    if (!window.confirm(confirmMsg)) return;

    let reason = "";
    if (action === "reject") {
      reason = window.prompt("Rejection reason:") || "Documents not valid";
    }

    try {
      setProcessing(id);
      await verifyShopApi(id, action, reason);
      await load();
      setViewing(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    } finally {
      setProcessing(null);
    }
  };

  const filtered = shops.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.phone?.includes(search) ||
      s.address?.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl">Shops</h1>
          <p className="text-sm text-muted">{shops.length} shops</p>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="p-3 rounded-xl bg-white shadow-card text-sm outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by shop name, phone, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white shadow-card border border-transparent outline-none focus:border-primary text-sm"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiShoppingBag className="text-5xl text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No shops found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((shop) => (
            <div key={shop._id} className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {shop.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">{shop.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${statusColors[shop.status]}`}
                    >
                      {shop.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate">
                    Owner: {shop.owner?.name}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {shop.category}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-xs mb-3">
                <div className="flex items-center gap-1 text-muted">
                  <FiPhone className="text-primary" /> {shop.phone}
                </div>
                <div className="flex items-center gap-1 text-muted">
                  <FiMapPin className="text-primary" />
                  {shop.address?.city}, {shop.address?.pincode}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => setViewing(shop)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100"
                >
                  <FiEye /> View
                </button>

                {shop.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleVerify(shop._id, "approve")}
                      disabled={processing === shop._id}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-50 text-green-600 text-xs font-semibold hover:bg-green-100 disabled:opacity-50"
                    >
                      <FiCheckCircle /> Approve
                    </button>
                    <button
                      onClick={() => handleVerify(shop._id, "reject")}
                      disabled={processing === shop._id}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-50 text-danger text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
                    >
                      <FiXCircle /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {viewing && (
        <ShopDetailModal
          shop={viewing}
          onClose={() => setViewing(null)}
          onVerify={handleVerify}
          processing={processing}
        />
      )}
    </div>
  );
};

// ============ Detail Modal ============
const ShopDetailModal = ({ shop, onClose, onVerify, processing }) => (
  <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-card w-full max-w-3xl my-8">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg">
            {shop.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg">{shop.name}</h2>
            <p className="text-xs text-muted">{shop.category}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg">
          <FiX />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        {/* Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted">Status</span>
          <span
            className={`px-3 py-1 rounded-md text-xs font-semibold ${statusColors[shop.status]}`}
          >
            {shop.status}
          </span>
        </div>

        {/* Owner */}
        <Section title="Owner" icon={FiShoppingBag}>
          <Info label="Name" value={shop.owner?.name} />
          <Info label="Email" value={shop.owner?.email} />
          <Info label="Phone" value={shop.phone} />
        </Section>

        {/* Shop Info */}
        <Section title="Shop Details" icon={FiShoppingBag}>
          <Info label="Name" value={shop.name} />
          <Info label="Category" value={shop.category} />
          <Info label="Description" value={shop.description} />
          <Info label="Phone" value={shop.phone} />
          {shop.openingTime && (
            <Info
              label="Timing"
              value={`${shop.openingTime} - ${shop.closingTime}`}
            />
          )}
        </Section>

        {/* Address */}
        <Section title="Address" icon={FiMapPin}>
          <Info
            label="Location"
            value={[
              shop.address?.line1,
              shop.address?.city,
              shop.address?.state,
              shop.address?.pincode,
            ]
              .filter(Boolean)
              .join(", ")}
          />
          {shop.location?.coordinates && (
            <Info
              label="Coordinates"
              value={`[${shop.location.coordinates[0].toFixed(4)}, ${shop.location.coordinates[1].toFixed(4)}]`}
            />
          )}
        </Section>

        {/* Legal */}
        <Section title="Legal / KYC" icon={FiFileText}>
          <Info label="GST" value={shop.legal?.gstNumber} />
          <Info label="PAN" value={shop.legal?.panNumber} />
          <Info
            label="Aadhaar"
            value={
              shop.legal?.aadhaarNumber
                ? `XXXX-XXXX-${shop.legal.aadhaarNumber.slice(-4)}`
                : "—"
            }
          />
          <Info label="Shop License" value={shop.legal?.shopLicenseNumber} />
          <Info label="Registration" value={shop.legal?.registrationNumber} />
          <Info label="FSSAI" value={shop.legal?.fssaiNumber} />
        </Section>

        {/* Bank */}
        <Section title="Bank Details" icon={FiFileText}>
          <Info label="Holder" value={shop.bank?.accountHolderName} />
          <Info label="Account" value={shop.bank?.accountNumber} />
          <Info label="IFSC" value={shop.bank?.ifscCode} />
          <Info label="Bank" value={shop.bank?.bankName} />
        </Section>

        {/* Documents */}
        <Section title="Documents" icon={FiFileText}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(shop.documents || {}).map(([key, url]) =>
              url ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-bg border border-gray-200">
                    <img
                      src={url}
                      alt={key}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[10px] text-muted mt-1 text-center capitalize truncate">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                </a>
              ) : null
            )}
          </div>
        </Section>

        {shop.status === "REJECTED" && shop.rejectionReason && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <b>Rejection reason:</b> {shop.rejectionReason}
          </div>
        )}
      </div>

      {/* Actions */}
      {shop.status === "PENDING" && (
        <div className="flex gap-3 p-5 border-t">
          <button
            onClick={() => onVerify(shop._id, "reject")}
            disabled={processing === shop._id}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-danger text-danger font-semibold text-sm hover:bg-red-50 disabled:opacity-50"
          >
            <FiXCircle /> Reject
          </button>
          <button
            onClick={() => onVerify(shop._id, "approve")}
            disabled={processing === shop._id}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-green-600 disabled:opacity-50"
          >
            <FiCheckCircle /> Approve
          </button>
        </div>
      )}
    </div>
  </div>
);

// Helpers
const Section = ({ title, icon: Icon, children }) => (
  <div>
    <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2 text-primary">
      <Icon /> {title}
    </h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const Info = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted">{label}</span>
    <span className="font-medium text-right ml-4">{value || "—"}</span>
  </div>
);

export default AdminShops;