import { useState, useEffect } from "react";

export const useLocation = () => {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem("asali_location");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(loc);
        localStorage.setItem("asali_location", JSON.stringify(loc));
        setLoading(false);
      },
      (err) => {
        setError("Location permission denied");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const setManualLocation = (lat, lng, name = "Manual") => {
    const loc = { lat, lng, name };
    setLocation(loc);
    localStorage.setItem("asali_location", JSON.stringify(loc));
  };

  const clearLocation = () => {
    setLocation(null);
    localStorage.removeItem("asali_location");
  };

  return {
    location,
    loading,
    error,
    detectLocation,
    setManualLocation,
    clearLocation,
  };
};