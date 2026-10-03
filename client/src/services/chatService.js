import api from "./api";

export const createOrGetChatApi = async (userId, productId = null) => {
  const res = await api.post("/chats", { userId, productId });
  return res.data;
};

export const fetchMyChats = async () => {
  const res = await api.get("/chats");
  return res.data;
};

export const fetchMessages = async (chatId) => {
  const res = await api.get(`/chats/${chatId}/messages`);
  return res.data;
};

export const sendMessageApi = async (chatId, data) => {
  const res = await api.post(`/chats/${chatId}/messages`, data);
  return res.data;
};

export const respondToOfferApi = async (messageId, action, counterAmount) => {
  const res = await api.put(`/chats/messages/${messageId}/offer`, {
    action,
    counterAmount,
  });
  return res.data;
};