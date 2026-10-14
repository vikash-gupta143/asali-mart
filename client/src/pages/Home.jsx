import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiTruck, FiShield, FiTag, FiHeadphones,
  FiCopy, FiCheck, FiMapPin,
} from "react-icons/fi";
import ProductCard from "../components/common/ProductCard";
import { fetchProducts } from "../services/productService";
import { fetchActiveCoupons } from "../services/couponService";
import { fetchNearbyProducts } from "../services/shopService";
import { useLocation } from "../context/LocationContext";


const categories = [
  { id: 1, name: "Electronics", icon: "📱", color: "#E3F2FD" },
  { id: 2, name: "Fashion", icon: "👕", color: "#FCE4EC" },
  { id: 3, name: "Grocery", icon: "🛒", color: "#E8F5E9" },
  { id: 4, name: "Home", icon: "🏠", color: "#FFF3E0" },
  { id: 5, name: "Beauty", icon: "💄", color: "#F3E5F5" },
  { id: 6, name: "Sports", icon: "⚽", color: "#E0F7FA" },
  { id: 7, name: "Toys", icon: "🧸", color: "#FFF9C4" },
  { id: 8, name: "Books", icon: "📚", color: "#EDE7F6" },
];

import DeliveryBanner from "../components/common/DeliveryBanner";

// JSX me:
<DeliveryBanner />

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🌍 Location
  const { location } = useLocation();

  // 🎟️ Coupons
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");

  // Load products — Nearby first, fallback to all
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        let data;

        if (location) {
          // 🌍 Nearby products — 10 km
          try {
            data = await fetchNearbyProducts(location.lat, location.lng, 5, {
              limit: 8,
            });
          } catch (nearbyErr) {
            console.warn("Nearby failed, falling back to all products");
            data = await fetchProducts({ limit: 8 });
          }
        } else {
          // Location nahi — saare products
          data = await fetchProducts({ limit: 8 });
        }

        setProducts(data.products || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [location]);

  // Load coupons
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchActiveCoupons();
        setCoupons(data.coupons || []);
      } catch (err) {
        console.error("Coupons load error:", err.message);
      }
    };
    load();
  }, []);

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="container-custom py-6 space-y-10">
      {/* HERO */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white,transparent_60%)]" />
        <div className="relative px-6 sm:px-12 py-12 sm:py-20 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-4">
            🎉 Local Marketplace
          </span>
          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl leading-tight mb-4">
            Shop from <br /> Nearby Shops
          </h1>
          <p className="text-white/90 mb-6 text-sm sm:text-base">
            Get products delivered from your local shops in minutes. Bargain
            directly with sellers!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="px-6 py-3 rounded-xl bg-white text-primary font-semibold hover:bg-gray-100 transition flex items-center gap-2"
            >
              Shop Now <FiArrowRight />
            </Link>
            <Link
              to="/shops"
              className="px-6 py-3 rounded-xl bg-white/20 backdrop-blur font-semibold hover:bg-white/30 transition"
            >
              Nearby Shops
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FiTruck, title: "Fast Delivery", desc: "From nearby shops" },
          { icon: FiShield, title: "Secure Payment", desc: "100% protected" },
          { icon: FiTag, title: "Best Prices", desc: "Bargain directly" },
          { icon: FiHeadphones, title: "24/7 Support", desc: "Always here" },
        ].map((f, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 shadow-card flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xl">
              <f.icon />
            </div>
            <div>
              <p className="font-semibold text-sm text-dark">{f.title}</p>
              <p className="text-xs text-muted">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CATEGORIES */}
      <section>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-heading font-bold text-xl sm:text-2xl">
            Shop by Category
          </h2>
          <Link
            to="/categories"
            className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <FiArrowRight />
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.name}`}
              className="bg-white rounded-xl p-3 shadow-card hover:shadow-hover transition text-center group"
            >
              <div
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition"
                style={{ backgroundColor: cat.color }}
              >
                {cat.icon}
              </div>
              <p className="text-xs font-medium text-dark">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 🎟️ COUPONS */}
      {coupons.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-bold text-xl sm:text-2xl">
              🎟️ Available Coupons
            </h2>
            <Link
              to="/coupons"
              className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {coupons.slice(0, 3).map((c) => (
              <div
                key={c._id}
                className="relative bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-dashed border-primary/40 rounded-2xl p-4 overflow-hidden"
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-bg" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-bg" />

                <div className="flex items-center gap-2 mb-2">
                  <FiTag className="text-primary text-xl" />
                  <span className="font-heading font-bold text-xl text-primary">
                    {c.discountType === "PERCENTAGE"
                      ? `${c.discountValue}% OFF`
                      : `₹${c.discountValue} OFF`}
                  </span>
                </div>
                <p className="text-xs text-muted mb-1 line-clamp-1">
                  {c.description}
                </p>
                <p className="text-[10px] text-muted mb-3">
                  Min order ₹{c.minOrderValue}
                  {c.maxDiscount && ` · Max ₹${c.maxDiscount}`}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-dashed border-primary/30">
                  <span className="px-2.5 py-1 rounded-md bg-white border border-dashed border-primary text-xs font-bold text-primary tracking-wider">
                    {c.code}
                  </span>
                  <button
                    onClick={() => handleCopyCoupon(c.code)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition"
                  >
                    {copiedCode === c.code ? (
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
              </div>
            ))}
          </div>
        </section>
      )}

      {/* OFFER BANNER */}
      <section className="rounded-2xl bg-gradient-to-r from-secondary to-[#2a2a4e] text-white p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-primary font-bold text-sm">LIMITED TIME</span>
          <h3 className="font-heading font-bold text-2xl sm:text-3xl mt-1">
            Flat 40% OFF on Fashion
          </h3>
          <p className="text-gray-300 text-sm mt-1">Use code: ASALI40</p>
        </div>
        <Link
          to="/products?category=Fashion"
          className="px-6 py-3 rounded-xl bg-primary font-semibold hover:bg-primary-dark transition"
        >
          Grab Deal
        </Link>
      </section>

      {/* 🌍 NEARBY / FEATURED PRODUCTS */}
      <section>
        <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
          <div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl flex items-center gap-2">
              {location ? (
                <>
                  <FiMapPin className="text-primary" /> Nearby Products
                </>
              ) : (
                "Featured Products"
              )}
            </h2>
            {location && (
              <p className="text-xs text-muted mt-0.5">
                📍 Within 5 km of {location.name}
              </p>
            )}
          </div>
          <Link
            to="/products"
            className="text-primary text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-xl text-center">
            ⚠️ {error}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <div className="text-6xl mb-4">
              {location ? "🏪" : "📦"}
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">
              {location
                ? "No nearby products"
                : "No products yet"}
            </h3>
            <p className="text-sm text-muted">
              {location
                ? `Koi product 5 km ke andar nahi mila.... Location change karein ya baad me try karein.`
                : "Sellers will add products soon"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-card overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
    </div>
  </div>
);

export default Home;