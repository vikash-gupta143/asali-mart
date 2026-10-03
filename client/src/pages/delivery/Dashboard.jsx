import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiDollarSign, FiPackage, FiTruck, FiTrendingUp,
  FiArrowRight, FiNavigation, FiToggleLeft, FiToggleRight,
  FiMapPin,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { fetchEarnings } from "../../services/deliveryService";
import {
  updateLocationApi,
  toggleAvailabilityApi,
  fetchMyApplication,
} from "../../services/deliveryPartnerService";

const Dashboard = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🟢 Online/Offline state
  const [isOnline, setIsOnline] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [partner, setPartner] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [earnData, appData] = await Promise.all([
          fetchEarnings().catch(() => null),
          fetchMyApplication().catch(() => null),
        ]);

        if (earnData) setEarnings(earnData);
        if (appData?.partner) {
          setPartner(appData.partner);
          setIsOnline(appData.partner.isAvailable || false);

          // Agar coordinates valid hain to location name dikhao
          const coords = appData.partner.currentLocation?.coordinates;
          if (coords && (coords[0] !== 0 || coords[1] !== 0)) {
            setLocationName("Location active");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 🌍 Go Online — location detect karke backend me bhejo
  const handleGoOnline = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          // 🌍 Reverse geocoding — city name nikaalo
          let cityName = "Your location";
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
              { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            const addr = data.address || {};
            cityName =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.county ||
              addr.state ||
              "Your location";
          } catch (e) {
            console.error("Reverse geocoding failed");
          }

          await updateLocationApi(latitude, longitude, true);
          setIsOnline(true);
          setLocationName(cityName);
        } catch (err) {
          alert(err.response?.data?.message || "Failed to go online");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        alert("Location permission required to go online");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 🔴 Go Offline
  const handleGoOffline = async () => {
    try {
      await toggleAvailabilityApi(false);
      setIsOnline(false);
    } catch (err) {
      alert("Failed to go offline");
    }
  };

  const stats = [
    {
      label: "Today's Earnings",
      value: `₹${earnings?.todayEarnings || 0}`,
      icon: FiDollarSign,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Today's Deliveries",
      value: earnings?.todayDeliveries || 0,
      icon: FiPackage,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Earnings",
      value: `₹${earnings?.totalEarnings || 0}`,
      icon: FiTrendingUp,
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "Total Deliveries",
      value: earnings?.totalDeliveries || 0,
      icon: FiTruck,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white">
        <h1 className="font-heading font-bold text-2xl mb-1">
          Welcome, {user?.name?.split(" ")[0]} 🚚
        </h1>
        <p className="text-white/80 text-sm">
          {isOnline
            ? "You are online — ready to receive orders"
            : "Go online to start receiving deliveries"}
        </p>
      </div>

      {/* 🟢 Online/Offline Toggle */}
      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition ${
                isOnline
                  ? "bg-accent/10 text-accent"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <FiToggleRight className="text-3xl" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg">
                {isOnline ? "🟢 You're Online" : "⚫ You're Offline"}
              </p>
              <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                {isOnline && locationName ? (
                  <>
                    <FiMapPin className="text-primary" /> {locationName}
                  </>
                ) : (
                  "Toggle to receive delivery orders"
                )}
              </p>
            </div>
          </div>

          {isOnline ? (
            <button
              onClick={handleGoOffline}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-50 text-danger font-semibold text-sm hover:bg-red-100 transition"
            >
              <FiToggleLeft className="text-xl" /> Go Offline
            </button>
          ) : (
            <button
              onClick={handleGoOnline}
              disabled={locating || partner?.status !== "APPROVED"}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-green-600 transition disabled:opacity-50"
            >
              {locating ? (
                <>
                  <FiNavigation className="animate-spin" /> Detecting...
                </>
              ) : (
                <>
                  <FiToggleRight className="text-xl" /> Go Online
                </>
              )}
            </button>
          )}
        </div>

        {partner?.status !== "APPROVED" && (
          <div className="mt-4 p-3 rounded-xl bg-yellow-50 text-yellow-700 text-xs">
            ⚠️ Your account is <b>{partner?.status || "not approved"}</b>. You
            can go online only after admin approves your application.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-card p-4">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3 ${s.color}`}
            >
              <s.icon />
            </div>
            <p className="text-2xl font-heading font-bold">
              {loading ? "..." : s.value}
            </p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <h2 className="font-heading font-bold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/delivery/available"
            className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition"
          >
            <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
              <FiPackage />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Available Orders</p>
              <p className="text-xs text-muted">Accept new deliveries</p>
            </div>
            <FiArrowRight className="text-primary" />
          </Link>

          <Link
            to="/delivery/my-deliveries"
            className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 transition"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <FiTruck />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">My Deliveries</p>
              <p className="text-xs text-muted">Track your active deliveries</p>
            </div>
            <FiArrowRight className="text-blue-500" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;