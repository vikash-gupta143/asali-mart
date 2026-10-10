import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const Privacy = () => {
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
          Privacy Policy
        </h1>
        <p className="text-xs text-muted mb-6">
          Last updated: {new Date().toLocaleDateString("en-IN")}
        </p>

        <div className="prose prose-sm max-w-none text-dark space-y-5 text-sm leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              1. Introduction
            </h2>
            <p>
              At AsaliMart, we respect your privacy and are committed to
              protecting your personal data. This Privacy Policy explains how
              we collect, use, and safeguard your information.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              2. Information We Collect
            </h2>
            <p className="mb-2"><b>Personal Information:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name, email, phone number</li>
              <li>Delivery address</li>
              <li>Payment information</li>
              <li>Profile picture (optional)</li>
            </ul>

            <p className="mt-3 mb-2"><b>Automatic Information:</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Device information (browser, OS)</li>
              <li>IP address</li>
              <li>Location (with permission)</li>
              <li>Browsing activity on our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process orders and payments</li>
              <li>To deliver products to your address</li>
              <li>To send order updates via email/SMS</li>
              <li>To improve our services</li>
              <li>To prevent fraud and ensure security</li>
              <li>To send promotional offers (with consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              4. Information Sharing
            </h2>
            <p>We share your information only with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Sellers:</b> Name, delivery address for order fulfillment</li>
              <li><b>Delivery Partners:</b> Name, phone, address for delivery</li>
              <li><b>Payment Gateways:</b> For secure payment processing</li>
              <li><b>Legal Authorities:</b> If required by law</li>
            </ul>
            <p className="mt-2">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              5. Data Security
            </h2>
            <p>
              We use industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Password encryption (bcrypt)</li>
              <li>SSL/TLS encryption</li>
              <li>Secure payment gateways</li>
              <li>Regular security audits</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              6. Cookies
            </h2>
            <p>
              We use cookies and similar technologies to enhance your
              experience, remember your preferences, and analyze usage. You
              can disable cookies in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              7. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account</li>
              <li>Opt-out of marketing communications</li>
              <li>Lodge a complaint with authorities</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              8. Data Retention
            </h2>
            <p>
              We retain your data as long as your account is active or as
              needed to provide services. Order data is retained for 7 years
              for legal/tax purposes.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              9. Children's Privacy
            </h2>
            <p>
              Our services are not intended for children under 18. We do not
              knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              10. Changes to Privacy Policy
            </h2>
            <p>
              We may update this policy periodically. Significant changes
              will be notified via email or platform notification.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg mb-2">
              11. Contact Us
            </h2>
            <p>
              For privacy-related questions:
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

export default Privacy;