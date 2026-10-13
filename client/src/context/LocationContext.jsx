// File: client/src/context/LocationContext.jsx

import { createContext, useContext, useState, useEffect } from "react";

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem("asali_location");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [permissionStatus, setPermissionStatus] = useState("prompt");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [autoAttempted, setAutoAttempted] = useState(false);

  // Save to localStorage
  useEffect(() => {
    if (location) {
      localStorage.setItem("asali_location", JSON.stringify(location));
    }
  }, [location]);

  // Permission status check
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setPermissionStatus(result.state);
          result.onchange = () => {
            setPermissionStatus(result.state);
          };
        })
        .catch(() => {});
    }
  }, []);

  // 🔧 buildLocation — reverse geocoding
  const buildLocation = async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    let name = "Your Location";

    // Try 1: Nominatim
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
        return { lat, lng, name };
      }
    } catch (err) {
      console.log("Nominatim failed");
    }

    // Try 2: BigDataCloud
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
        return { lat, lng, name };
      }
    } catch (err) {
      console.log("BigDataCloud failed");
    }

    return { lat, lng, name: `${lat.toFixed(2)}, ${lng.toFixed(2)}` };
  };

  // 🎯 Error message
  const getErrorMessage = (err) => {
    if (!err || !err.code) {
      return err?.message || "Location nahi mil payi";
    }
    switch (err.code) {
      case 1:
        return "Location permission block ho gayi. Pincode daalein.";
      case 2:
        return "Location available nahi hai. Pincode daalein.";
      case 3:
        return "Location timeout. Dobara try karein.";
      default:
        return "Location nahi mili. Pincode daalein.";
    }
  };

  // 🌍 detectLocation — browser popup
  const detectLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      setLoading(true);
      setError("");

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const loc = await buildLocation(pos);
            setLocation(loc);
            setLoading(false);
            setPermissionStatus("granted");
            resolve(loc);
          } catch (err) {
            setError(err.message);
            setLoading(false);
            reject(err);
          }
        },
        (err) => {
          const msg = getErrorMessage(err);
          setError(msg);
          setLoading(false);
          if (err.code === 1) {
            setPermissionStatus("denied");
            setShowLocationModal(true); // 🆕 Block hone pe modal khule
          }
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // 🆕 autoDetectLocation — App.jsx me use hota hai
  const autoDetectLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      // Already saved — skip
      const saved = localStorage.getItem("asali_location");
      if (saved) {
        resolve(JSON.parse(saved));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const loc = await buildLocation(pos);
            setLocation(loc);
            setPermissionStatus("granted");
            resolve(loc);
          } catch (err) {
            reject(err);
          }
        },
        (err) => {
          const msg = getErrorMessage(err);
          setError(msg);
          if (err.code === 1) {
            setPermissionStatus("denied");
            setShowLocationModal(true); // 🆕 Block hone pe modal
          }
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // 📍 Manual location
  const setManualLocation = (lat, lng, name = "Manual") => {
    const loc = { lat, lng, name };
    setLocation(loc);
    setError("");
    setPermissionStatus("granted");
    return loc;
  };

  // 📍 Pincode se location
  const setLocationByPincode = async (pincode) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );

      if (!res.ok) {
        throw new Error("Pincode verify nahi ho paya");
      }

      const data = await res.json();

      if (data[0]?.Status !== "Success") {
        throw new Error("Yeh pincode exist nahi karta");
      }

      const postOffice = data[0].PostOffice[0];

      const loc = {
        pincode: pincode,
        name: `${postOffice.Name}, ${postOffice.District}`,
        city: postOffice.District,
        state: postOffice.State,
        lat: null,
        lng: null,
      };

      setLocation(loc);
      setPermissionStatus("granted");
      setLoading(false);

      return loc;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Modal controls
  const openLocationModal = () => setShowLocationModal(true);
  const closeLocationModal = () => setShowLocationModal(false);

  const clearLocation = () => {
    setLocation(null);
    setError("");
    localStorage.removeItem("asali_location");
    sessionStorage.removeItem("location_asked");
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        permissionStatus,
        showLocationModal,
        openLocationModal,
        closeLocationModal,
        detectLocation,
        autoDetectLocation, // ✅ Export ho raha hai
        setManualLocation,
        setLocationByPincode,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
};