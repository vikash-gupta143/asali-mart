import api from "./api";

// Get all products with filters
export const fetchProducts = async (params = {}) => {
  const res = await api.get("/products", { params });
  return res.data;
};

// Get single product
export const fetchProductById = async (id) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

// Seller — get own products
export const fetchMyProducts = async () => {
  const res = await api.get("/products/seller/my-products");
  return res.data;
};

// Create product (seller/admin)
export const createProduct = async (data) => {
  const res = await api.post("/products", data);
  return res.data;
};

// Update product
export const updateProductApi = async (id, data) => {
  const res = await api.put(`/products/${id}`, data);
  return res.data;
};

// Delete product
export const deleteProductApi = async (id) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};