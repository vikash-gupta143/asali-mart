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

// Payouts
export const fetchAllPayouts = async (status) => {
  const res = await api.get("/admin/payouts", { params: { status } });
  return res.data;
};

export const approvePayoutApi = async (id, notes) => {
  const res = await api.put(`/admin/payouts/${id}/approve`, { notes });
  return res.data;
};

export const rejectPayoutApi = async (id, reason) => {
  const res = await api.put(`/admin/payouts/${id}/reject`, { reason });
  return res.data;
};

export const markPayoutPaidApi = async (id, data) => {
  const res = await api.put(`/admin/payouts/${id}/paid`, data);
  return res.data;
};

export const verifySellerBankApi = async (sellerId) => {
  const res = await api.put(`/admin/sellers/${sellerId}/verify-bank`);
  return res.data;
};

// Bank Verification
export const fetchBankVerifications = async (status) => {
  const res = await api.get("/admin/bank-verifications", { params: { status } });
  return res.data;
};

export const verifySellerBankDetailsApi = async (sellerId) => {
  const res = await api.put(`/admin/bank-verifications/${sellerId}/verify`);
  return res.data;
};

export const rejectSellerBankDetailsApi = async (sellerId, reason) => {
  const res = await api.put(`/admin/bank-verifications/${sellerId}/reject`, { reason });
  return res.data;
};