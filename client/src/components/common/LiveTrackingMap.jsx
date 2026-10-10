import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiNavigation } from "react-icons/fi";
import api from "../../services/api";

// 🛵 Fix default marker icons (Leaflet ka common issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 🏪 Shop icon
const shopIcon = new L.DivIcon({
  html: `<div style="background:#FF6B00;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏪</div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// 📍 Customer icon
const customerIcon = new L.DivIcon({
  html: `<div style="background:#10B981;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">📍</div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// 🛵 Delivery boy icon (moving)
const bikeIcon = new L.DivIcon({
  html: `<div style="background:#3B82F6;color:white;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;border:3px solid white;box-shadow:0 4px 12px rgba(59,130,246,0.5);animation:pulse 2s infinite">🛵</div>
  <style>
    @keyframes pulse {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>`,
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const LiveTrackingMap = ({ orderId, pickupCoords, dropCoords }) => {
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 📍 Fetch delivery boy location every 30 seconds
  useEffect(() => {
    if (!orderId) return;

    const fetchLocation = async () => {
      try {
        const res = await api.get(`/orders/${orderId}/tracking`);
        if (res.data.success && res.data.location) {
          setDeliveryLocation(res.data.location);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error("Tracking fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchLocation();

    // Poll every 30 seconds
    const interval = setInterval(fetchLocation, 30000);

    return () => clearInterval(interval);
  }, [orderId]);

  // Default center: pickup location ya customer location
  const center = pickupCoords
    ? [pickupCoords.lat, pickupCoords.lng]
    : dropCoords
    ? [dropCoords.lat, dropCoords.lng]
    : [19.076, 72.8777]; // Mumbai default

  // Build route line: shop → delivery boy → customer
  const routePoints = [];
  if (pickupCoords) routePoints.push([pickupCoords.lat, pickupCoords.lng]);
  if (deliveryLocation)
    routePoints.push([deliveryLocation.lat, deliveryLocation.lng]);
  if (dropCoords) routePoints.push([dropCoords.lat, dropCoords.lng]);

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden mb-5">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
            <FiNavigation />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">
              🛵 Live Delivery Tracking
            </p>
            <p className="text-[10px] text-muted">
              {lastUpdate
                ? `Last updated: ${lastUpdate.toLocaleTimeString("en-IN")}`
                : "Fetching location..."}
            </p>
          </div>
        </div>
        {deliveryLocation ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            Waiting...
          </span>
        )}
      </div>

      {/* Map */}
      <div style={{ height: "400px", width: "100%" }}>
        <MapContainer
          center={center}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 🏪 Shop Marker */}
          {pickupCoords && (
            <Marker
              position={[pickupCoords.lat, pickupCoords.lng]}
              icon={shopIcon}
            >
              <Popup>
                <b>🏪 Pickup Point</b>
              </Popup>
            </Marker>
          )}

          {/* 📍 Customer Marker */}
          {dropCoords && (
            <Marker
              position={[dropCoords.lat, dropCoords.lng]}
              icon={customerIcon}
            >
              <Popup>
                <b>📍 Your Location</b>
              </Popup>
            </Marker>
          )}

          {/* 🛵 Delivery Boy Marker (live) */}
          {deliveryLocation && (
            <Marker
              position={[deliveryLocation.lat, deliveryLocation.lng]}
              icon={bikeIcon}
            >
              <Popup>
                <b>🛵 Delivery Partner</b>
                <br />
                On the way to you
              </Popup>
            </Marker>
          )}

          {/* Route Line */}
          {routePoints.length >= 2 && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: "#3B82F6",
                weight: 3,
                dashArray: "10, 10",
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-bg border-t">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted uppercase">Shop</p>
            <p className="text-xs font-semibold">🏪 Pickup</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase">Status</p>
            <p className="text-xs font-semibold text-blue-600">
              {deliveryLocation ? "🛵 Moving" : "⏳ Waiting"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase">Your Location</p>
            <p className="text-xs font-semibold">📍 Drop</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingMap;