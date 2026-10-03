import api from "./api";

// Public
export const fetchActiveCoupons = async () => {
  const res = await api.get("/coupons");
  return res.data;
};

// Customer — validate
export const validateCouponApi = async (code, orderValue) => {
  const res = await api.post("/coupons/validate", { code, orderValue });
  return res.data;
};

// Admin
export const fetchAllCoupons = async () => {
  const res = await api.get("/coupons/admin");
  return res.data;
};

export const createCouponApi = async (data) => {
  const res = await api.post("/coupons", data);
  return res.data;
};

export const toggleCouponApi = async (id) => {
  const res = await api.put(`/coupons/${id}/toggle`);
  return res.data;
};

export const deleteCouponApi = async (id) => {
  const res = await api.delete(`/coupons/${id}`);
  return res.data;
};