import { useState } from "react";

// 🌍 Helper: Get full address from lat/lng (for auto-fill)
export const getFullAddress = async (lat, lng) => {
  if (!lat || !lng) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "AsaliMart/1.0",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // 🏠 Build address line
      const line1Parts = [
        addr.house_number,
        addr.road,
        addr.neighbourhood,
        addr.suburb,
      ].filter(Boolean);

      return {
        line1: line1Parts.join(", ") || data.display_name?.split(",")[0] || "",
        city:
          addr.city ||
          addr.town ||
          addr.village ||
          addr.suburb ||
          addr.county ||
          addr.state_district ||
          "",
        state: addr.state || "",
        pincode: addr.postcode || "",
        country: addr.country || "India",
      };
    }
  } catch (err) {
    console.log("❌ getFullAddress failed:", err.message);
  }

  return null;
};

export const useLocation = () => {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem("asali_location");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔧 Helper — build location with fallbacks
  const buildLocation = async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    let name = "Your Location";

    // 🥇 Try 1: Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "AsaliMart/1.0",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        name =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.suburb ||
          addr.county ||
          addr.state_district ||
          addr.state ||
          "Your Location";
        console.log("✅ Nominatim:", name);
        return { lat, lng, name };
      }
    } catch (err) {
      console.log("❌ Nominatim failed:", err.message);
    }

    // 🥈 Try 2: BigDataCloud
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );

      if (res.ok) {
        const data = await res.json();
        name =
          data.city ||
          data.locality ||
          data.principalSubdivision ||
          data.countryName ||
          "Your Location";
        console.log("✅ BigDataCloud:", name);
        return { lat, lng, name };
      }
    } catch (err) {
      console.log("❌ BigDataCloud failed:", err.message);
    }

    // 🥉 Fallback: coordinates
    console.log("⚠️ All geocoding failed");
    return { lat, lng, name: `${lat.toFixed(2)}, ${lng.toFixed(2)}` };
  };

  // 🌍 Manual detect
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = await buildLocation(pos);
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

  // 🌍 Auto-detect (promise)
  const autoDetectLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const loc = await buildLocation(pos);
            setLocation(loc);
            localStorage.setItem("asali_location", JSON.stringify(loc));
            resolve(loc);
          } catch (err) {
            reject(err);
          }
        },
        (err) => {
          reject(err.message || "Permission denied");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
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
    autoDetectLocation,
    setManualLocation,
    clearLocation,
  };
};