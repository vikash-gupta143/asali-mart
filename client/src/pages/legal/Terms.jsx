import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const Terms = () => {
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
          Terms & Conditions
        </h1>
        <p className="text-xs text-muted mb-6">
          Last updated: {new Date().toLocaleDateString("en-IN")}
        </p>

        <div className="prose prose-sm max-w-none text-dark space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using AsaliMart ("the Platform"), you accept and
              agree to be bound by these Terms & Conditions. If you do not
              agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              2. About AsaliMart
            </h2>
            <p>
              AsaliMart is an online marketplace that connects customers with
              local sellers and shops. We facilitate transactions but are not
              the seller of any product. All products are sold by independent
              sellers.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              3. User Accounts
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be 18+ to create an account</li>
              <li>You must provide accurate information</li>
              <li>You are responsible for your account security</li>
              <li>One person may have only one account</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              4. Seller Terms
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Sellers must complete KYC verification</li>
              <li>Products must be genuine and legal</li>
              <li>Sellers are responsible for their product quality</li>
              <li>AsaliMart charges 5% commission per order</li>
              <li>Platform fee of ₹10 per order applies</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              5. Orders & Payments
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All prices are in INR (₹)</li>
              <li>COD (Cash on Delivery) and Online Payment accepted</li>
              <li>Order confirmation depends on seller acceptance</li>
              <li>Delivery time may vary based on location</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              6. Prohibited Activities
            </h2>
            <p>Users shall NOT:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Post fake or misleading products</li>
              <li>Manipulate reviews or ratings</li>
              <li>Engage in fraudulent transactions</li>
              <li>Violate any applicable laws</li>
              <li>Abuse or harass other users</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              7. Intellectual Property
            </h2>
            <p>
              All content on AsaliMart, including logos, text, images, is the
              property of AsaliMart or its content suppliers and is protected
              by applicable copyright laws.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              8. Limitation of Liability
            </h2>
            <p>
              AsaliMart is not liable for any indirect, incidental, or
              consequential damages arising from use of the Platform. Our
              maximum liability is limited to the value of the transaction.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              9. Account Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate any account that
              violates these terms, without prior notice.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              10. Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. Continued use of
              the Platform constitutes acceptance of updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              11. Governing Law
            </h2>
            <p>
              These terms are governed by the laws of India. Any disputes
              shall be subject to the exclusive jurisdiction of courts in
              India.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              12. Contact
            </h2>
            <p>
              For any questions regarding these Terms, contact us at:
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

export default Terms;