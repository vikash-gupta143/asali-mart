import api from "./api";

// ============================================
// 📝 Registration (with file upload)
// ============================================
export const registerDeliveryPartnerApi = async (formData) => {
  const res = await api.post("/delivery-partners/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ============================================
// 📋 My application
// ============================================
export const fetchMyApplication = async () => {
  const res = await api.get("/delivery-partners/me");
  return res.data;
};

// ============================================
// 📍 Location & Availability (delivery partner)
// ============================================
export const updateLocationApi = async (lat, lng, isAvailable) => {
  const res = await api.put("/delivery-partners/location", {
    lat,
    lng,
    isAvailable,
  });
  return res.data;
};

export const toggleAvailabilityApi = async (isAvailable) => {
  const res = await api.put("/delivery-partners/availability", {
    isAvailable,
  });
  return res.data;
};

// ============================================
// 🌍 Nearby partners (seller, admin)
// ============================================
export const fetchNearbyPartners = async (lat, lng, radius = 10) => {
  const res = await api.get("/delivery-partners/nearby", {
    params: { lat, lng, radius },
  });
  return res.data;
};

// ============================================
// 🛡️ Admin
// ============================================
export const fetchAllApplications = async (status) => {
  const res = await api.get("/delivery-partners", { params: { status } });
  return res.data;
};

export const verifyApplicationApi = async (id, action, reason) => {
  const res = await api.put(`/delivery-partners/${id}/verify`, {
    action,
    reason,
  });
  return res.data;
};