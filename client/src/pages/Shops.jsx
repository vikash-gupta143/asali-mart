import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiMapPin, FiStar, FiNavigation } from "react-icons/fi";
import { fetchAllShops, fetchNearbyShops } from "../services/shopService";
import { useLocation } from "../hooks/useLocation";

const Shops = () => {
  const { location, detectLocation } = useLocation();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (showNearbyOnly && location) {
          const data = await fetchNearbyShops(location.lat, location.lng, radius);
          setShops(data.shops || []);
        } else {
          const data = await fetchAllShops();
          setShops(data.shops || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [location, radius, showNearbyOnly]);

  return (
    <div className="container-custom py-6">
      <div className="flex justify-between items-start flex-wrap gap-3 mb-5">
        <div>
          <h1 className="font-heading font-bold text-2xl">Shops</h1>
          <p className="text-sm text-muted">{shops.length} shops available</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {!location ? (
            <button
              onClick={detectLocation}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              <FiNavigation /> Enable Location
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowNearbyOnly(!showNearbyOnly)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  showNearbyOnly
                    ? "bg-primary text-white"
                    : "bg-white shadow-card text-dark"
                }`}
              >
                📍 Nearby Only
              </button>

              {showNearbyOnly && (
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="px-4 py-2 rounded-xl bg-white shadow-card text-sm outline-none"
                >
                  <option value={2}>2 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-card p-5 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="font-heading font-bold text-lg mb-2">No shops found</h3>
          <p className="text-sm text-muted">
            {showNearbyOnly
              ? `No shops within ${radius} km. Try increasing radius.`
              : "No shops registered yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map((shop) => (
            <Link
              key={shop._id}
              to={`/shops/${shop._id}`}
              className="bg-white rounded-xl shadow-card hover:shadow-hover transition overflow-hidden group"
            >
              <div className="h-24 bg-gradient-to-r from-primary to-primary-light relative">
                {shop.distance !== undefined && (
                  <span className="absolute top-2 right-2 bg-white text-primary text-xs font-bold px-2 py-1 rounded-md">
                    📍 {shop.distance} km
                  </span>
                )}
              </div>

              <div className="p-4 -mt-8 relative">
                <div className="w-14 h-14 rounded-xl bg-white shadow-card border-2 border-white flex items-center justify-center text-primary font-bold text-xl mb-2">
                  {shop.name[0]}
                </div>
                <h3 className="font-heading font-bold text-dark line-clamp-1">
                  {shop.name}
                </h3>
                <p className="text-xs text-muted line-clamp-1 mb-2">
                  {shop.address?.city || "Unknown city"} • {shop.category}
                </p>

                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-400 fill-yellow-400" />
                    <span className="text-muted">{shop.rating || "New"}</span>
                  </div>
                  {shop.isVerified && (
                    <span className="text-accent font-semibold">✓ Verified</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shops;