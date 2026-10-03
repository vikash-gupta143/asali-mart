import { useState } from "react";
import { FiMapPin, FiX, FiCrosshair } from "react-icons/fi";

const cities = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
];

const LocationModal = ({ isOpen, onClose, onSelect, currentLocation }) => {
  const [detecting, setDetecting] = useState(false);

  if (!isOpen) return null;

  const handleDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        let name = "Current Location";

        // 🌍 Reverse geocoding — coordinates se city name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
            {
              headers: { "Accept-Language": "en" },
            }
          );
          const data = await res.json();
          const addr = data.address || {};
          name =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.county ||
            addr.state ||
            "Current Location";
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        }

        onSelect({ lat, lng, name });
        setDetecting(false);
        onClose();
      },
      () => {
        alert("Location access denied. Please select a city manually.");
        setDetecting(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-bg"
        >
          <FiX />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <FiMapPin className="text-2xl" />
          </div>
          <h2 className="font-heading font-bold text-xl">Select Location</h2>
          <p className="text-sm text-muted mt-1">
            Choose your location to see nearby shops
          </p>
        </div>

        <button
          onClick={handleDetect}
          disabled={detecting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-60 mb-4"
        >
          <FiCrosshair />
          {detecting ? "Detecting..." : "Use My Current Location"}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-muted">or choose city</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {cities.map((c) => {
            const isActive =
              currentLocation &&
              Math.abs(currentLocation.lat - c.lat) < 0.01 &&
              Math.abs(currentLocation.lng - c.lng) < 0.01;

            return (
              <button
                key={c.name}
                onClick={() => {
                  onSelect({ lat: c.lat, lng: c.lng, name: c.name });
                  onClose();
                }}
                className={`p-3 rounded-xl text-sm font-medium border-2 transition ${
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 hover:border-primary"
                }`}
              >
                📍 {c.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;