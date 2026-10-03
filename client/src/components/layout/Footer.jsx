import { Link } from "react-router-dom";
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube, FiMail, FiPhone } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="bg-secondary text-white mt-16">
      <div className="container-custom py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-lg">
              A
            </div>
            <span className="font-heading font-bold text-xl">
              Asali<span className="text-primary">Mart</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Your local marketplace. Shop from nearby shops, get fast delivery, and bargain directly with sellers.
          </p>
          <div className="flex gap-3">
            {[FiFacebook, FiInstagram, FiTwitter, FiYoutube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {["Home", "Products", "Categories", "Shops", "Offers"].map((item) => (
              <li key={item}>
                <Link to="#" className="hover:text-primary transition">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* For Sellers */}
        <div>
          <h4 className="font-heading font-semibold mb-4">For Sellers</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {["Become a Seller", "Seller Dashboard", "Pricing", "Guide", "Support"].map((item) => (
              <li key={item}>
                <Link to="#" className="hover:text-primary transition">{item}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <FiMail className="text-primary" /> support@asalimart.com
            </li>
            <li className="flex items-center gap-2">
              <FiPhone className="text-primary" /> +91 98765 43210
            </li>
          </ul>
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Get exclusive offers</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 rounded-l-lg bg-white/10 border border-white/20 text-sm outline-none"
              />
              <button className="px-4 py-2 bg-primary rounded-r-lg text-sm font-semibold hover:bg-primary-dark transition">
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-custom py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
          <p>© 2026 AsaliMart. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-primary">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary">Terms</Link>
            <Link to="#" className="hover:text-primary">Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;