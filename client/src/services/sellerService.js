import api from "./api";

export const fetchSellerEarnings = async () => {
  const res = await api.get("/seller/earnings");
  return res.data;
};


// Wallet
export const fetchSellerWallet = async () => {
  const res = await api.get("/seller/wallet");
  return res.data;
};

export const updateBankDetailsApi = async (data) => {
  const res = await api.put("/seller/bank", data);
  return res.data;
};

export const requestWithdrawApi = async (amount, method = "BANK") => {
  const res = await api.post("/seller/withdraw", { amount, method });
  return res.data;
};

export const fetchMyPayouts = async () => {
  const res = await api.get("/seller/payouts");
  return res.data;
};