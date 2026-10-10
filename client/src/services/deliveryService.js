// import api from "./api";

// // Available orders for delivery partner
// export const fetchAvailableOrders = async () => {
//   const res = await api.get("/delivery/available");
//   return res.data;
// };

// // Accept delivery
// export const acceptDeliveryApi = async (orderId) => {
//   const res = await api.put(`/delivery/${orderId}/accept`);
//   return res.data;
// };

// // Mark picked up
// export const markPickedUpApi = async (orderId) => {
//   const res = await api.put(`/delivery/${orderId}/pickup`);
//   return res.data;
// };

// // Verify OTP and deliver
// export const verifyDeliveryOTPApi = async (orderId, otp) => {
//   const res = await api.put(`/delivery/${orderId}/deliver`, { otp });
//   return res.data;
// };

// // My deliveries
// export const fetchMyDeliveries = async () => {
//   const res = await api.get("/delivery/my-deliveries");
//   return res.data;
// };

// // Earnings
// export const fetchEarnings = async () => {
//   const res = await api.get("/delivery/earnings");
//   return res.data;
// };

// // Register as delivery partner (role change)
// export const registerAsDeliveryPartnerApi = async () => {
//   const res = await api.post("/delivery/register");
//   return res.data;
// };


import api from "./api";

// Available orders for delivery partner
// 🆕 Optional: lat, lng, pincode pass karo to filtered orders milenge
export const fetchAvailableOrders = async (lat, lng, pincode) => {
  const params = {};
  if (lat) params.lat = lat;
  if (lng) params.lng = lng;
  if (pincode) params.pincode = pincode;

  const res = await api.get("/delivery/available", { params });
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
export const verifyDeliveryOTPApi = async (orderId, otp, paymentMethod) => {
  const res = await api.put(`/delivery/${orderId}/deliver`, {
    otp,
    paymentMethod,
  });
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

// Wallet
export const fetchDeliveryWallet = async () => {
  const res = await api.get("/delivery/wallet");
  return res.data;
};

export const updateDeliveryBankApi = async (data) => {
  const res = await api.put("/delivery/bank", data);
  return res.data;
};

export const requestDeliveryWithdrawApi = async (amount, method = "BANK") => {
  const res = await api.post("/delivery/withdraw", { amount, method });
  return res.data;
};

export const settleCashApi = async (amount, method, reference) => {
  const res = await api.put("/delivery/settle-cash", { amount, method, reference });
  return res.data;
};

