// 🚚 Delivery Configuration
export const DELIVERY_CONFIG = {
  radius: {
    day: 5,
    evening: 5,
    night: 5,
  },
  timeWindows: {
    day: { start: 6, end: 17 },
    evening: { start: 17, end: 21 },
  },
  timeEstimates: {
    "0-2": { min: 15, max: 20 },
    "2-5": { min: 25, max: 35 },
    "5-10": { min: 35, max: 50 },
  },
  charges: {
    "0-2": 20,
    "2-5": 30,
    "5-10": 50,
  },
};

// 🕐 Get current time window
export const getCurrentTimeWindow = () => {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

// 📏 Get current max delivery radius
export const getCurrentRadius = () => {
  const window = getCurrentTimeWindow();
  return DELIVERY_CONFIG.radius[window];
};

// ⏱️ Get delivery time estimate
export const getDeliveryEstimate = (distance) => {
  if (distance <= 2) return DELIVERY_CONFIG.timeEstimates["0-2"];
  if (distance <= 5) return DELIVERY_CONFIG.timeEstimates["2-5"];
  return DELIVERY_CONFIG.timeEstimates["5-10"];
};

// 💰 Get delivery charge
export const getDeliveryCharge = (distance) => {
  if (distance <= 2) return DELIVERY_CONFIG.charges["0-2"];
  if (distance <= 5) return DELIVERY_CONFIG.charges["2-5"];
  return DELIVERY_CONFIG.charges["5-10"];
};

// ✅ Check if delivery is available
export const isDeliveryAvailable = (distance) => {
  const maxRadius = getCurrentRadius();
  return distance <= maxRadius;
};

// 📊 Get full delivery info
export const getDeliveryInfo = (distance) => {
  const window = getCurrentTimeWindow();
  const maxRadius = getCurrentRadius();
  const available = distance <= maxRadius;
  const estimate = getDeliveryEstimate(distance);
  const charge = getDeliveryCharge(distance);

  return {
    available,
    distance: Math.round(distance * 10) / 10,
    maxRadius,
    window,
    estimate,
    charge,
  };
};

// 📐 Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export default DELIVERY_CONFIG;