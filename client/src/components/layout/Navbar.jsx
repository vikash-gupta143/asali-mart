import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiMapPin,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "../../context/LocationContext";
import LocationModal from "../common/LocationModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const { location, setManualLocation } = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${search}`);
      setSearch("");
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setDropdownOpen(false);
    navigate("/");
  };

  const closeDropdown = () => setDropdownOpen(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Categories", path: "/categories" },
    { name: "Shops", path: "/shops" },
    { name: "Coupons", path: "/coupons" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-soft">
        {/* Top Bar — Location */}
        <div className="bg-secondary text-white text-xs py-1.5">
          <div className="container-custom flex items-center justify-between">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1 hover:text-primary transition"
            >
              <FiMapPin className="text-primary" />
              <span>
                Deliver to:{" "}
                <b className="underline decoration-dotted">
                  {location?.name || "Select Location"}
                </b>
              </span>
            </button>
            <span className="hidden sm:block">🇮🇳 India | Local Marketplace</span>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="container-custom py-3 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span className="font-heading font-bold text-xl text-dark hidden sm:block">
              Asali<span className="text-primary">Mart</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex">
            <div className="relative w-full">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, shops, categories..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg border border-gray-200 focus:border-primary outline-none text-sm"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl hover:bg-bg transition"
            >
              <FiShoppingCart className="text-xl text-dark" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User / Login */}
            {isAuthenticated ? (
              <div
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-bg transition"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.name?.split(" ")[0]}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full pt-2 z-50">
                    <div className="w-56 bg-white rounded-xl shadow-card py-2">
                      {user?.role === "ADMIN" && (
                        <Link
                          to="/admin"
                          onClick={closeDropdown}
                          className="block px-4 py-2 text-sm font-semibold text-primary hover:bg-bg"
                        >
                          🛡️ Admin Panel
                        </Link>
                      )}

                      {user?.role === "SELLER" && (
                        <Link
                          to="/seller"
                          onClick={closeDropdown}
                          className="block px-4 py-2 text-sm font-semibold text-primary hover:bg-bg"
                        >
                          🏪 Seller Panel
                        </Link>
                      )}

                      {user?.role === "DELIVERY_PARTNER" && (
                        <Link
                          to="/delivery"
                          onClick={closeDropdown}
                          className="block px-4 py-2 text-sm font-semibold text-accent hover:bg-bg"
                        >
                          🚚 Delivery Panel
                        </Link>
                      )}

                      {user?.role === "CUSTOMER" && (
                        <Link
                          to="/delivery/become-partner"
                          onClick={closeDropdown}
                          className="block px-4 py-2 text-sm hover:bg-bg"
                        >
                          🚚 Become Delivery Partner
                        </Link>
                      )}

                      <Link
                        to="/chat"
                        onClick={closeDropdown}
                        className="block px-4 py-2 text-sm hover:bg-bg"
                      >
                        💬 Messages
                      </Link>

                      <Link
                        to="/profile"
                        onClick={closeDropdown}
                        className="block px-4 py-2 text-sm hover:bg-bg"
                      >
                        👤 My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={closeDropdown}
                        className="block px-4 py-2 text-sm hover:bg-bg"
                      >
                        📦 My Orders
                      </Link>
                      <Link
                        to="/my-reviews"
                        onClick={closeDropdown}
                        className="block px-4 py-2 text-sm hover:bg-bg"
                      >
                        ⭐ My Reviews
                      </Link>
                      <Link
                        to="/cart"
                        onClick={closeDropdown}
                        className="block px-4 py-2 text-sm hover:bg-bg"
                      >
                        🛒 Cart
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition"
              >
                <FiUser /> Login
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-bg"
            >
              {isOpen ? (
                <FiX className="text-xl" />
              ) : (
                <FiMenu className="text-xl" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:block border-t border-gray-100">
          <div className="container-custom flex gap-6 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-medium text-muted hover:text-primary transition"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg border border-gray-200 outline-none text-sm"
                />
              </div>
            </form>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-sm font-medium text-dark hover:text-primary"
              >
                {link.name}
              </Link>
            ))}

            <hr className="my-1" />

            {isAuthenticated ? (
              <>
                {user?.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block py-2 text-sm font-semibold text-primary"
                  >
                    🛡️ Admin Panel
                  </Link>
                )}

                {user?.role === "SELLER" && (
                  <Link
                    to="/seller"
                    onClick={() => setIsOpen(false)}
                    className="block py-2 text-sm font-semibold text-primary"
                  >
                    🏪 Seller Panel
                  </Link>
                )}

                {user?.role === "DELIVERY_PARTNER" && (
                  <Link
                    to="/delivery"
                    onClick={() => setIsOpen(false)}
                    className="block py-2 text-sm font-semibold text-accent"
                  >
                    🚚 Delivery Panel
                  </Link>
                )}

                {user?.role === "CUSTOMER" && (
                  <Link
                    to="/delivery/become-partner"
                    onClick={() => setIsOpen(false)}
                    className="block py-2 text-sm font-medium text-dark"
                  >
                    🚚 Become Delivery Partner
                  </Link>
                )}

                <Link
                  to="/chat"
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-sm font-medium text-dark"
                >
                  💬 Messages
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-sm font-medium text-dark"
                >
                  👤 My Profile
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-sm font-medium text-dark"
                >
                  📦 My Orders
                </Link>
                <Link
                  to="/my-reviews"
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-sm font-medium text-dark"
                >
                  ⭐ My Reviews
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-center py-2.5 rounded-xl bg-red-50 text-danger font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block text-center py-2.5 rounded-xl bg-primary text-white font-semibold"
              >
                Login / Signup
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={(loc) => setManualLocation(loc.lat, loc.lng, loc.name)}
        currentLocation={location}
      />
    </>
  );
};

export default Navbar;