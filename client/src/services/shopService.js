import api from "./api";

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

export const fetchMyShop = async () => {
  const res = await api.get("/shops/my/shop");
  return res.data;
};

export const createShopApi = async (data) => {
  const res = await api.post("/shops", data);
  return res.data;
};

export const updateShopApi = async (id, data) => {
  const res = await api.put(`/shops/${id}`, data);
  return res.data;
};