import api from "./api";

export const fetchProductReviews = async (productId) => {
  const res = await api.get(`/reviews/product/${productId}`);
  return res.data;
};

export const createReviewApi = async (data) => {
  const res = await api.post("/reviews", data);
  return res.data;
};

export const updateReviewApi = async (id, data) => {
  const res = await api.put(`/reviews/${id}`, data);
  return res.data;
};

export const deleteReviewApi = async (id) => {
  const res = await api.delete(`/reviews/${id}`);
  return res.data;
};

export const markHelpfulApi = async (id) => {
  const res = await api.put(`/reviews/${id}/helpful`);
  return res.data;
};

export const sellerRespondApi = async (id, text) => {
  const res = await api.put(`/reviews/${id}/respond`, { text });
  return res.data;
};

export const fetchMyReviews = async () => {
  const res = await api.get("/reviews/my-reviews");
  return res.data;
};