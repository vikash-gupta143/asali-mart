import { useState, useEffect } from "react";

export const useDeliveryInfo = () => {
  const [info, setInfo] = useState(getCurrentDeliveryInfo());

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setInfo(getCurrentDeliveryInfo());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return info;
};

// 🕐 Get current delivery info
const getCurrentDeliveryInfo = () => {
  const hour = new Date().getHours();

  let window = "night";
  let maxRadius = 5;

  if (hour >= 6 && hour < 17) {
    window = "day";
    maxRadius = 10;
  } else if (hour >= 17 && hour < 21) {
    window = "evening";
    maxRadius = 5;
  } else {
    window = "night";
    maxRadius = 5;
  }

  return {
    window,
    maxRadius,
    label: {
      day: "☀️ Day Delivery",
      evening: "🌆 Evening Delivery",
      night: "🌙 Night Delivery",
    }[window],
    message: {
      day: "10 km tak delivery available",
      evening: "5 km tak delivery available",
      night: "5 km tak delivery available (night)",
    }[window],
    radiusText: `${maxRadius} km`,
  };
};

// 📏 Calculate distance between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ⏱️ Get delivery time estimate
export const getTimeEstimate = (distance) => {
  if (distance <= 2) return "15-20 min";
  if (distance <= 5) return "25-35 min";
  return "35-50 min";
};

// 💰 Get delivery charge
export const getDeliveryCharge = (distance) => {
  if (distance <= 2) return 20;
  if (distance <= 5) return 30;
  return 50;
};