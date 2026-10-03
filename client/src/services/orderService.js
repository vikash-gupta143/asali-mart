import api from "./api";

// Create order
export const createOrderApi = async (data) => {
  const res = await api.post("/orders", data);
  return res.data;
};

// Get my orders (customer)
export const fetchMyOrders = async () => {
  const res = await api.get("/orders/my-orders");
  return res.data;
};

// Get single order
export const fetchOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;
};

// Cancel order
export const cancelOrderApi = async (id, reason) => {
  const res = await api.put(`/orders/${id}/cancel`, { reason });
  return res.data;
};

// Seller — get seller orders
export const fetchSellerOrders = async () => {
  const res = await api.get("/orders/seller/orders");
  return res.data;
};

// Seller — update order status
export const updateOrderStatusApi = async (id, status) => {
  const res = await api.put(`/orders/${id}/status`, { status });
  return res.data;
};