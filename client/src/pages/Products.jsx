import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiFilter } from "react-icons/fi";
import ProductCard from "../components/common/ProductCard";
import FilterSidebar from "../components/common/FilterSidebar";
import { fetchProducts } from "../services/productService";
import { fetchNearbyProducts } from "../services/shopService";
import { useLocation } from "../hooks/useLocation";

const categoriesList = [
  { id: 1, name: "Electronics", icon: "📱", color: "#E3F2FD" },
  { id: 2, name: "Fashion", icon: "👕", color: "#FCE4EC" },
  { id: 3, name: "Grocery", icon: "🛒", color: "#E8F5E9" },
  { id: 4, name: "Home", icon: "🏠", color: "#FFF3E0" },
  { id: 5, name: "Beauty", icon: "💄", color: "#F3E5F5" },
  { id: 6, name: "Sports", icon: "⚽", color: "#E0F7FA" },
  { id: 7, name: "Toys", icon: "🧸", color: "#FFF9C4" },
  { id: 8, name: "Books", icon: "📚", color: "#EDE7F6" },
];

const Products = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "All"
  );
  const [priceRange, setPriceRange] = useState(5000);
  const [sortBy, setSortBy] = useState("popular");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 🆕 Nearby
  const { location, detectLocation } = useLocation();
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [radius, setRadius] = useState(5);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        let data;

        if (nearbyOnly && location) {
          // 🆕 Nearby products
          data = await fetchNearbyProducts(location.lat, location.lng, radius, {
            category: selectedCategory !== "All" ? selectedCategory : undefined,
          });
        } else {
          // Normal products
          const params = {
            sort: sortBy,
            maxPrice: priceRange,
            limit: 50,
          };
          if (selectedCategory !== "All") params.category = selectedCategory;
          data = await fetchProducts(params);
        }

        setProducts(data.products || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, priceRange, sortBy, nearbyOnly, radius, location]);

  const handleNearbyToggle = () => {
    if (!location) {
      // Auto detect location
      detectLocation();
      setNearbyOnly(true);
    } else {
      setNearbyOnly(!nearbyOnly);
    }
  };

  return (
    <div className="container-custom py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl">
            {nearbyOnly ? "Nearby Products" : "All Products"}
          </h1>
          <p className="text-sm text-muted">
            {products.length} products found
            {nearbyOnly && location && (
              <span className="ml-2 text-primary font-semibold">
                • within {radius} km of {location.name}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 🆕 Nearby Only toggle */}
          <button
            onClick={handleNearbyToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              nearbyOnly
                ? "bg-primary text-white"
                : "bg-white shadow-card text-dark"
            }`}
          >
            📍 Nearby Only
          </button>

          {/* 🆕 Radius selector — only when nearby */}
          {nearbyOnly && location && (
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-white shadow-card text-sm outline-none"
            >
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
            </select>
          )}

          <button
            onClick={() => setIsFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-card text-sm font-semibold"
          >
            <FiFilter /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="hidden lg:block w-72 shrink-0">
          <FilterSidebar
            categories={categoriesList}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            sortBy={sortBy}
            setSortBy={setSortBy}
            isOpen={true}
            onClose={() => {}}
          />
        </div>

        <div className="lg:hidden">
          <FilterSidebar
            categories={categoriesList}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            sortBy={sortBy}
            setSortBy={setSortBy}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-xl text-center">
              ⚠️ {error}
            </div>
          ) : products.length === 0 ? (
            <EmptyState nearbyOnly={nearbyOnly} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
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

const EmptyState = ({ nearbyOnly }) => (
  <div className="bg-white rounded-xl shadow-card p-12 text-center">
    <div className="text-6xl mb-4">🔍</div>
    <h3 className="font-heading font-bold text-lg mb-2">
      {nearbyOnly ? "No nearby products" : "No products found"}
    </h3>
    <p className="text-sm text-muted">
      {nearbyOnly
        ? "Try increasing the radius or disable Nearby Only"
        : "Try changing filters or price range"}
    </p>
  </div>
);

export default Products;