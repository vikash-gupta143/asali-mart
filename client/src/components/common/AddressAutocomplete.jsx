import { useEffect, useRef, useState } from "react";
import { FiMapPin, FiLoader, FiSearch } from "react-icons/fi";

/**
 * Address Autocomplete using Nominatim (OpenStreetMap)
 * 100% Free — No API key needed
 */
const AddressAutocomplete = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search your address...",
  className = "",
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // 🆕 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🆕 Search Nominatim with debounce
  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=in&limit=6&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "AsaliMart/1.0",
        },
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setSuggestions(data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error("Nominatim search error:", err.message);
      setError("Search failed. Try again.");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Handle input change with debounce
  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    // Clear previous timeout
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Debounce — wait 600ms before API call
    debounceRef.current = setTimeout(() => {
      searchAddress(text);
    }, 600);
  };

  // 🆕 Handle suggestion click
  const handleSelect = (place) => {
    const addr = place.address || {};

    // Build line1
    const line1Parts = [
      addr.house_number,
      addr.road,
      addr.neighbourhood,
      addr.suburb,
    ].filter(Boolean);

    const line1 =
      line1Parts.join(", ") ||
      place.display_name?.split(",")[0] ||
      place.display_name;

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.county ||
      addr.state_district ||
      "";

    const pincode = addr.postcode || "";
    const state = addr.state || "";

    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);

    onPlaceSelect({
      line1,
      city,
      pincode,
      state,
      lat,
      lng,
      formattedAddress: place.display_name,
    });

    onChange(line1);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm ${className}`}
          autoComplete="off"
        />
        {loading && (
          <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      {/* 🆕 Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((place, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(place)}
              className="w-full text-left px-4 py-3 hover:bg-primary/5 border-b border-gray-100 last:border-b-0 transition flex items-start gap-2"
            >
              <FiMapPin className="text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">
                  {place.display_name?.split(",")[0]}
                </p>
                <p className="text-[10px] text-muted truncate">
                  {place.display_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-[10px] text-danger mt-1">⚠️ {error}</p>}

      <p className="text-[10px] text-muted mt-1">
        💡 Type karein (min 3 letters) aur dropdown se address select karein
      </p>
    </div>
  );
};

export default AddressAutocomplete;