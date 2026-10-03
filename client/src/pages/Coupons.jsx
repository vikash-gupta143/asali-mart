import { useState, useEffect } from "react";
import { FiTag, FiCopy, FiCheck } from "react-icons/fi";
import { fetchActiveCoupons } from "../services/couponService";

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchActiveCoupons();
        setCoupons(data.coupons || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="container-custom py-10 text-center text-muted">Loading...</div>;

  return (
    <div className="container-custom py-6">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl mb-1">Available Coupons</h1>
        <p className="text-sm text-muted">Save big on your next order</p>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiTag className="text-5xl text-muted mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-2">No coupons available</h3>
          <p className="text-sm text-muted">Check back later for new offers</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div
              key={c._id}
              className="relative bg-white rounded-2xl shadow-card overflow-hidden border-2 border-dashed border-primary/30"
            >
              {/* Ticket shape */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-bg" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-bg" />

              <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-white">
                <div className="flex items-center gap-2">
                  <FiTag className="text-xl" />
                  <span className="font-heading font-bold text-2xl">
                    {c.discountType === "PERCENTAGE"
                      ? `${c.discountValue}% OFF`
                      : `₹${c.discountValue} OFF`}
                  </span>
                </div>
                {c.maxDiscount && (
                  <p className="text-xs opacity-90 mt-1">
                    Max discount ₹{c.maxDiscount}
                  </p>
                )}
              </div>

              <div className="p-4">
                <p className="text-sm text-dark font-medium mb-1">
                  {c.description}
                </p>
                <p className="text-xs text-muted mb-3">
                  Min order: ₹{c.minOrderValue}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-dashed">
                  <div className="px-3 py-1.5 rounded-lg bg-bg border border-dashed border-primary">
                    <span className="font-bold text-sm text-primary tracking-wider">
                      {c.code}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(c.code)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
                  >
                    {copied === c.code ? (
                      <>
                        <FiCheck /> Copied
                      </>
                    ) : (
                      <>
                        <FiCopy /> Copy
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-muted mt-3">
                  Valid till{" "}
                  {new Date(c.validUntil).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Coupons;