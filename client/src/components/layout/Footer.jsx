import { Link } from "react-router-dom";
import {
  FiFacebook, FiInstagram, FiTwitter, FiYoutube,
  FiMail, FiPhone, FiMapPin,
} from "react-icons/fi";

const Footer = () => {
  // Quick links with actual paths
  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Categories", path: "/categories" },
    { name: "Shops", path: "/shops" },
    { name: "Coupons", path: "/coupons" },
  ];

  const sellerLinks = [
    { name: "Become a Seller", path: "/signup" },
    { name: "Seller Dashboard", path: "/seller" },
    { name: "Add Product", path: "/seller/add-product" },
    { name: "My Shop", path: "/seller/shop" },
    { name: "Support", path: "/contact" },
  ];

  const legalLinks = [
    { name: "Terms & Conditions", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Refund Policy", path: "/refund" },
    { name: "Shipping Policy", path: "/shipping" },
  ];

  return (
    <footer className="bg-secondary text-white mt-16">
      <div className="container-custom py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
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
            Your local marketplace. Shop from nearby shops, get fast delivery,
            and bargain directly with sellers.
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
            {quickLinks.map((link) => (
              <li key={link.name}>
                <Link to={link.path} className="hover:text-primary transition">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* For Sellers */}
        <div>
          <h4 className="font-heading font-semibold mb-4">For Sellers</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            {sellerLinks.map((link) => (
              <li key={link.name}>
                <Link to={link.path} className="hover:text-primary transition">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-heading font-semibold mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <FiMail className="text-primary mt-0.5 shrink-0" />
              <a
                href="mailto:guptavikashkumar143@gmail.com"
                className="hover:text-primary break-all"
              >
                guptavikashkumar143@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-2">
              <FiPhone className="text-primary mt-0.5 shrink-0" />
              <a href="tel:+917250882229" className="hover:text-primary">
                +91 72508 82229
              </a>
            </li>
            <li className="flex items-start gap-2">
              <FiMapPin className="text-primary mt-0.5 shrink-0" />
              <span>Gopalganj, Bihar - 841428</span>
            </li>
          </ul>

          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">
              Get exclusive offers
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 rounded-l-lg bg-white/10 border border-white/20 text-sm outline-none focus:border-primary"
              />
              <button className="px-4 py-2 bg-primary rounded-r-lg text-sm font-semibold hover:bg-primary-dark transition">
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">
          <p className="text-center sm:text-left">
            © 2026 <b className="text-white">AsaliMart</b>. All rights
            reserved.
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="hover:text-primary transition"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;