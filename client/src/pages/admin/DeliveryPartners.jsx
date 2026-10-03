import { useState, useEffect } from "react";
import {
  FiSearch, FiCheckCircle, FiXCircle, FiEye,
  FiUser, FiPhone, FiTruck, FiCreditCard, FiMapPin, FiX,
} from "react-icons/fi";
import {
  fetchAllApplications,
  verifyApplicationApi,
} from "../../services/deliveryPartnerService";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-gray-100 text-gray-700",
};

const AdminDeliveryPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null); // detail modal
  const [processing, setProcessing] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAllApplications(status === "ALL" ? "" : status);
      setPartners(data.partners || []);
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
        ? "Approve this delivery partner?"
        : "Reject this application?";
    if (!window.confirm(confirmMsg)) return;

    let reason = "";
    if (action === "reject") {
      reason = window.prompt("Rejection reason (optional):") || "Documents not valid";
    }

    try {
      setProcessing(id);
      await verifyApplicationApi(id, action, reason);
      await load();
      setViewing(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    } finally {
      setProcessing(null);
    }
  };

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      p.phone?.includes(search) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl">Delivery Partners</h1>
          <p className="text-sm text-muted">{partners.length} applications</p>
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
        </select>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by name, phone, email..."
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
          <FiTruck className="text-5xl text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No applications found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg text-muted text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Applicant</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Vehicle</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-t hover:bg-bg">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                          {p.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.fullName}</p>
                          <p className="text-xs text-muted truncate">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.phone}</td>
                    <td className="px-4 py-3 text-muted">
                      {p.vehicle?.type || "—"}
                      {p.vehicle?.number && (
                        <span className="text-xs block">{p.vehicle.number}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${statusColors[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewing(p)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="View details"
                        >
                          <FiEye />
                        </button>
                        {p.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleVerify(p._id, "approve")}
                              disabled={processing === p._id}
                              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50"
                              title="Approve"
                            >
                              <FiCheckCircle />
                            </button>
                            <button
                              onClick={() => handleVerify(p._id, "reject")}
                              disabled={processing === p._id}
                              className="p-2 rounded-lg bg-red-50 text-danger hover:bg-red-100 disabled:opacity-50"
                              title="Reject"
                            >
                              <FiXCircle />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewing && (
        <DetailModal
          partner={viewing}
          onClose={() => setViewing(null)}
          onVerify={handleVerify}
          processing={processing}
        />
      )}
    </div>
  );
};

// ——— Detail Modal ———
const DetailModal = ({ partner, onClose, onVerify, processing }) => (
  <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-card w-full max-w-2xl my-8">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
            {partner.fullName?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg">{partner.fullName}</h2>
            <p className="text-xs text-muted">{partner.email}</p>
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
          <span className={`px-3 py-1 rounded-md text-xs font-semibold ${statusColors[partner.status]}`}>
            {partner.status}
          </span>
        </div>

        {/* Personal */}
        <Section title="Personal Info" icon={FiUser}>
          <Info label="Full Name" value={partner.fullName} />
          <Info label="Phone" value={partner.phone} />
          <Info label="Email" value={partner.email} />
          <Info label="Gender" value={partner.gender} />
          <Info
            label="Date of Birth"
            value={partner.dateOfBirth ? new Date(partner.dateOfBirth).toLocaleDateString("en-IN") : "—"}
          />
        </Section>

        {/* KYC */}
        <Section title="KYC Documents" icon={FiCreditCard}>
          <Info
            label="Aadhaar"
            value={partner.aadhaarNumber ? `XXXX-XXXX-${partner.aadhaarNumber.slice(-4)}` : "—"}
          />
          <Info label="PAN" value={partner.panNumber} />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <DocPreview label="Aadhaar Front" url={partner.aadhaarFront} />
            <DocPreview label="Aadhaar Back" url={partner.aadhaarBack} />
            <DocPreview label="PAN Card" url={partner.panCard} />
            <DocPreview label="Selfie" url={partner.selfie} />
          </div>
        </Section>

        {/* Bank */}
        <Section title="Bank Details" icon={FiCreditCard}>
          <Info label="Account Number" value={partner.bankAccount?.accountNumber} />
          <Info label="IFSC" value={partner.bankAccount?.ifscCode} />
          <Info label="Holder Name" value={partner.bankAccount?.accountHolderName} />
          <Info label="Bank" value={partner.bankAccount?.bankName} />
        </Section>

        {/* Vehicle */}
        <Section title="Vehicle" icon={FiTruck}>
          <Info label="Type" value={partner.vehicle?.type} />
          <Info label="Number" value={partner.vehicle?.number} />
          <Info label="Model" value={partner.vehicle?.model} />
        </Section>

        {/* Address */}
        <Section title="Address" icon={FiMapPin}>
          <Info
            label="Location"
            value={[
              partner.address?.line1,
              partner.address?.city,
              partner.address?.state,
              partner.address?.pincode,
            ]
              .filter(Boolean)
              .join(", ")}
          />
        </Section>

        {/* Rejection reason */}
        {partner.status === "REJECTED" && partner.rejectionReason && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <b>Rejection reason:</b> {partner.rejectionReason}
          </div>
        )}
      </div>

      {/* Actions */}
      {partner.status === "PENDING" && (
        <div className="flex gap-3 p-5 border-t">
          <button
            onClick={() => onVerify(partner._id, "reject")}
            disabled={processing === partner._id}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-danger text-danger font-semibold text-sm hover:bg-red-50 disabled:opacity-50"
          >
            <FiXCircle /> Reject
          </button>
          <button
            onClick={() => onVerify(partner._id, "approve")}
            disabled={processing === partner._id}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-green-600 disabled:opacity-50"
          >
            <FiCheckCircle /> Approve
          </button>
        </div>
      )}
    </div>
  </div>
);

// ——— Helpers ———
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
    <span className="font-medium text-right">{value || "—"}</span>
  </div>
);

const DocPreview = ({ label, url }) => (
  <div>
    <p className="text-xs text-muted mb-1">{label}</p>
    {url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-video rounded-lg overflow-hidden bg-bg border border-gray-200"
      >
        <img src={url} alt={label} className="w-full h-full object-cover" />
      </a>
    ) : (
      <div className="aspect-video rounded-lg bg-bg flex items-center justify-center text-xs text-muted">
        Not uploaded
      </div>
    )}
  </div>
);

export default AdminDeliveryPartners;