import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const Shipping = () => {
  return (
    <div className="container-custom py-6 max-w-4xl">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-4"
      >
        <FiArrowLeft /> Back to Home
      </Link>

      <div className="bg-white rounded-2xl shadow-card p-6 sm:p-10">
        <h1 className="font-heading font-bold text-3xl mb-2">
          Shipping & Delivery Policy
        </h1>
        <p className="text-xs text-muted mb-6">
          Last updated: {new Date().toLocaleDateString("en-IN")}
        </p>

        <div className="prose prose-sm max-w-none text-dark space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              1. Delivery Areas
            </h2>
            <p>
              AsaliMart delivers to locations within India. Delivery
              availability depends on our seller network in your area. You
              can check delivery availability by entering your location on
              our platform.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              2. Delivery Time
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-bg">
                  <tr>
                    <th className="text-left p-2 border border-gray-200">Distance</th>
                    <th className="text-left p-2 border border-gray-200">Delivery Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-gray-200">0-5 km</td>
                    <td className="p-2 border border-gray-200">30 min - 2 hours</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200">5-10 km</td>
                    <td className="p-2 border border-gray-200">2-4 hours</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200">10-50 km</td>
                    <td className="p-2 border border-gray-200">Same day delivery</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200">50+ km</td>
                    <td className="p-2 border border-gray-200">1-3 days (courier)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              3. Delivery Charges
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>FREE delivery</b> on orders above ₹500</li>
              <li><b>₹30</b> delivery charge on orders below ₹500</li>
              <li><b>₹10</b> platform fee on all orders</li>
              <li>Delivery charge varies based on distance and seller location</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              4. Delivery Methods
            </h2>
            <p className="mb-2"><b>Seller Delivery:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Product delivered directly by the seller</li>
              <li>Fastest delivery for nearby orders</li>
              <li>Available for local shops</li>
            </ul>

            <p className="mt-3 mb-2"><b>AsaliMart Delivery:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Trained delivery partner delivers your order</li>
              <li>OTP verification for secure delivery</li>
              <li>Trackable delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              5. Delivery OTP
            </h2>
            <p>
              For security, you will receive a <b>4-digit OTP</b> via email
              when your order is shipped. Share this OTP only with the
              delivery person to complete the delivery.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              6. Order Tracking
            </h2>
            <p>Track your order in real-time:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Go to "My Orders"</li>
              <li>Click on your order</li>
              <li>View order status and tracking progress</li>
              <li>Contact delivery partner directly if needed</li>
            </ol>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              7. Failed Delivery
            </h2>
            <p>If delivery fails due to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Customer not available — 1 re-attempt made</li>
              <li>Wrong address — order may be cancelled</li>
              <li>No response — order returned to seller</li>
            </ul>
            <p className="mt-2">
              For COD orders returned, no charge applied. For online
              payments, refund processed in 3-5 days.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              8. Packaging
            </h2>
            <p>
              All products are securely packed to prevent damage during
              transit. Fragile items receive extra protection.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              9. Bulk Orders
            </h2>
            <p>
              For bulk orders or corporate gifting, contact us at
              support@asalimart.com with your requirements.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              10. Contact
            </h2>
            <p>
              Delivery-related queries:
              <br />
              <b>Email:</b> support@asalimart.com
              <br />
              <b>Phone:</b> +91 98765 43210
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Shipping;