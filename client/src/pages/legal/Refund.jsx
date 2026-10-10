import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const Refund = () => {
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
          Refund & Cancellation Policy
        </h1>
        <p className="text-xs text-muted mb-6">
          Last updated: {new Date().toLocaleDateString("en-IN")}
        </p>

        <div className="prose prose-sm max-w-none text-dark space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              1. Order Cancellation
            </h2>

            <p className="mb-2"><b>Customer Cancellation:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Free cancellation before order is shipped</li>
              <li>Cancellation not allowed once order is shipped/out for delivery</li>
              <li>Cancel from "My Orders" section</li>
            </ul>

            <p className="mt-3 mb-2"><b>Seller Cancellation:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Seller can reject order at PLACED status</li>
              <li>If seller doesn't respond in 30 min, order auto-cancels</li>
              <li>Customer gets notified via email</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              2. Refund Rules
            </h2>

            <p className="mb-2"><b>COD (Cash on Delivery) Orders:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>No refund needed — payment collected only on delivery</li>
              <li>If order cancelled, no charge applied</li>
            </ul>

            <p className="mt-3 mb-2"><b>Online Payment Orders:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Full refund if order cancelled before shipping</li>
              <li>Refund initiated within 24 hours of cancellation</li>
              <li>Amount credited in 1-3 hours (UPI) or 3-5 days (Card)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              3. Refund Timeline
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-bg">
                  <tr>
                    <th className="text-left p-2 border border-gray-200">Payment Method</th>
                    <th className="text-left p-2 border border-gray-200">Refund Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-gray-200">UPI (PhonePe/GPay)</td>
                    <td className="p-2 border border-gray-200">1-3 hours</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200">Netbanking</td>
                    <td className="p-2 border border-gray-200">2-4 hours</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200">Debit/Credit Card</td>
                    <td className="p-2 border border-gray-200">3-5 working days</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200">Wallet</td>
                    <td className="p-2 border border-gray-200">1 hour</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              4. Product Return & Replacement
            </h2>
            <p className="mb-2"><b>Eligible for Return:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Damaged product received</li>
              <li>Wrong product delivered</li>
              <li>Product doesn't match description</li>
              <li>Return request within 24 hours of delivery</li>
            </ul>

            <p className="mt-3 mb-2"><b>Not Eligible for Return:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Used or damaged by customer</li>
              <li>Missing original packaging</li>
              <li>Perishable goods (food items)</li>
              <li>Personal care items (opened)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              5. How to Request Refund
            </h2>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Go to "My Orders" section</li>
              <li>Select the order</li>
              <li>Click "Report Issue" / "Request Refund"</li>
              <li>Upload photos (if applicable)</li>
              <li>Submit reason</li>
              <li>Our team reviews within 24-48 hours</li>
              <li>Refund processed if approved</li>
            </ol>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              6. Failed Payments
            </h2>
            <p>
              If payment is deducted but order is not placed:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Auto-refund initiated within 24 hours</li>
              <li>Amount credited in 3-5 working days</li>
              <li>Contact support if not received</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              7. Seller Payouts
            </h2>
            <p>
              Seller earnings are credited after order delivery. Withdrawal
              requests processed within 2-3 working days via bank transfer.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              8. Contact Support
            </h2>
            <p>
              For refund-related queries:
              <br />
              <b>Email:</b> support@asalimart.com
              <br />
              <b>Phone:</b> +91 98765 43210
              <br />
              <b>Response time:</b> 24-48 hours
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Refund;