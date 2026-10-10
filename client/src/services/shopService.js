import api from "./api";

// ============ PUBLIC ============
export const fetchAllShops = async () => {
  const res = await api.get("/shops");
  return res.data;
};

export const fetchNearbyShops = async (lat, lng, radius = 5) => {
  const res = await api.get("/shops/nearby", {
    params: { lat, lng, radius },
  });
  return res.data;
};

export const fetchNearbyProducts = async (lat, lng, radius = 5, params = {}) => {
  const res = await api.get("/shops/nearby-products", {
    params: { lat, lng, radius, ...params },
  });
  return res.data;
};

export const fetchShopById = async (id) => {
  const res = await api.get(`/shops/${id}`);
  return res.data;
};

// ============ SELLER ============
export const fetchMyShop = async () => {
  const res = await api.get("/shops/my/shop");
  return res.data;
};

// Create shop (with FormData for documents)
export const createShopApi = async (formData) => {
  const res = await api.post("/shops", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Update shop (with FormData)
export const updateShopApi = async (id, formData) => {
  const res = await api.put(`/shops/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ============ ADMIN ============
export const adminFetchAllShops = async (status) => {
  const res = await api.get("/shops/admin/all", {
    params: { status },
  });
  return res.data;
};

export const verifyShopApi = async (id, action, reason) => {
  const res = await api.put(`/shops/${id}/verify`, { action, reason });
  return res.data;
};

export const checkPincodeApi = async (pincode, lat, lng) => {
  const res = await api.post("/shops/check-pincode", {
    pincode,
    lat,
    lng,
  });
  return res.data;
};