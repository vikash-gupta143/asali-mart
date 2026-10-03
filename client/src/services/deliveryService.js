import api from "./api";

// Available orders for delivery partner
export const fetchAvailableOrders = async () => {
  const res = await api.get("/delivery/available");
  return res.data;
};

// Accept delivery
export const acceptDeliveryApi = async (orderId) => {
  const res = await api.put(`/delivery/${orderId}/accept`);
  return res.data;
};

// Mark picked up
export const markPickedUpApi = async (orderId) => {
  const res = await api.put(`/delivery/${orderId}/pickup`);
  return res.data;
};

// Verify OTP and deliver
export const verifyDeliveryOTPApi = async (orderId, otp) => {
  const res = await api.put(`/delivery/${orderId}/deliver`, { otp });
  return res.data;
};

// My deliveries
export const fetchMyDeliveries = async () => {
  const res = await api.get("/delivery/my-deliveries");
  return res.data;
};

// Earnings
export const fetchEarnings = async () => {
  const res = await api.get("/delivery/earnings");
  return res.data;
};

// Register as delivery partner (role change)
export const registerAsDeliveryPartnerApi = async () => {
  const res = await api.post("/delivery/register");
  return res.data;
};