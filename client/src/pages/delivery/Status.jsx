import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiClock, FiCheckCircle, FiXCircle, FiArrowRight } from "react-icons/fi";
import { fetchMyApplication } from "../../services/deliveryPartnerService";

const Status = () => {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyApplication();
        setPartner(data.partner);
      } catch (err) {
        setPartner(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="container-custom py-10 text-center">Loading...</div>;

  if (!partner) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="font-heading font-bold text-2xl mb-2">No Application Found</h1>
        <Link to="/delivery/become-partner" className="text-primary font-semibold">
          Apply Now
        </Link>
      </div>
    );
  }

  const statusConfig = {
    PENDING: {
      icon: FiClock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      title: "Under Review",
      desc: "Your application is being verified. We'll notify you within 24-48 hours.",
    },
    APPROVED: {
      icon: FiCheckCircle,
      color: "text-accent",
      bg: "bg-green-50",
      title: "Approved! 🎉",
      desc: "Welcome to AsaliMart Delivery Team! You can start accepting orders.",
    },
    REJECTED: {
      icon: FiXCircle,
      color: "text-danger",
      bg: "bg-red-50",
      title: "Application Rejected",
      desc: partner.rejectionReason || "Your application was rejected.",
    },
  };

  const config = statusConfig[partner.status];
  const Icon = config.icon;

  return (
    <div className="container-custom py-10 max-w-2xl">
      <div className={`${config.bg} rounded-2xl p-8 text-center mb-6`}>
        <Icon className={`text-5xl ${config.color} mx-auto mb-3`} />
        <h1 className="font-heading font-bold text-2xl mb-2">{config.title}</h1>
        <p className="text-sm text-muted">{config.desc}</p>
      </div>

      {partner.status === "APPROVED" && (
        <button
          onClick={() => navigate("/delivery")}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold"
        >
          Go to Dashboard <FiArrowRight />
        </button>
      )}

      {/* Application details */}
      <div className="bg-white rounded-2xl shadow-card p-5 mt-4">
        <h2 className="font-heading font-bold mb-3">Application Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Name</span>
            <span className="font-medium">{partner.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Phone</span>
            <span className="font-medium">{partner.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Aadhaar</span>
            <span className="font-medium">
              XXXX-XXXX-{partner.aadhaarNumber?.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Vehicle</span>
            <span className="font-medium">
              {partner.vehicle?.type} {partner.vehicle?.number}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Submitted</span>
            <span className="font-medium">
              {new Date(partner.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Status;