// 🌍 Google Maps Service — Address verification
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Verify address using Google Geocoding API
 * @param {string} address - Full address string
 * @returns {Object|null} - { lat, lng, pincode, city, formattedAddress, verified }
 */
export const verifyAddress = async (address) => {
  if (!address || !GOOGLE_API_KEY) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_API_KEY}&region=in&language=en`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      console.log(`❌ Geocode failed: ${data.status}`);
      return null;
    }

    const result = data.results[0];
    const components = result.address_components || [];

    let pincode = "";
    let city = "";

    components.forEach((c) => {
      if (c.types.includes("postal_code")) pincode = c.long_name;
      if (c.types.includes("locality")) city = c.long_name;
      if (c.types.includes("administrative_area_level_2") && !city) {
        city = c.long_name;
      }
    });

    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      pincode,
      city,
      formattedAddress: result.formatted_address,
      verified: true,
    };
  } catch (err) {
    console.error("Google Geocode error:", err.message);
    return null;
  }
};

/**
 * Reverse geocode: lat/lng → address
 */
export const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng || !GOOGLE_API_KEY) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}&language=en`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) return null;

    const result = data.results[0];
    const components = result.address_components || [];

    let pincode = "";
    let city = "";
    let line1 = "";

    components.forEach((c) => {
      if (c.types.includes("street_number")) line1 = c.long_name + " " + line1;
      if (c.types.includes("route")) line1 = line1 + c.long_name;
      if (c.types.includes("sublocality")) {
        line1 = line1 ? `${line1}, ${c.long_name}` : c.long_name;
      }
      if (c.types.includes("locality")) city = c.long_name;
      if (c.types.includes("postal_code")) pincode = c.long_name;
    });

    return {
      line1: line1.trim() || result.formatted_address.split(",")[0],
      city,
      pincode,
      formattedAddress: result.formatted_address,
    };
  } catch (err) {
    console.error("Reverse geocode error:", err.message);
    return null;
  }
};