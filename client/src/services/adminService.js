import api from "./api";

export const fetchAdminStats = async () => {
  const res = await api.get("/admin/stats");
  return res.data;
};

export const fetchAllUsers = async (params = {}) => {
  const res = await api.get("/admin/users", { params });
  return res.data;
};

export const toggleUserStatusApi = async (id) => {
  const res = await api.put(`/admin/users/${id}/toggle`);
  return res.data;
};

export const deleteUserApi = async (id) => {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data;
};

export const fetchAllProductsAdmin = async () => {
  const res = await api.get("/admin/products");
  return res.data;
};

export const toggleProductStatusApi = async (id) => {
  const res = await api.put(`/admin/products/${id}/toggle`);
  return res.data;
};

export const deleteProductAdminApi = async (id) => {
  const res = await api.delete(`/admin/products/${id}`);
  return res.data;
};

export const fetchAllOrdersAdmin = async (status) => {
  const res = await api.get("/admin/orders", { params: { status } });
  return res.data;
};

export const deleteOrderAdminApi = async (id) => {
  const res = await api.delete(`/admin/orders/${id}`);
  return res.data;
};

export const fetchRevenueAnalytics = async () => {
  const res = await api.get("/admin/revenue");
  return res.data;
};