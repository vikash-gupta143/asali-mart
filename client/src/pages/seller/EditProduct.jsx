import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiX, FiPlus, FiSave, FiArrowLeft } from "react-icons/fi";
import {
  fetchProductById,
  updateProductApi,
} from "../../services/productService";

const categoriesList = [
  "Electronics", "Fashion", "Grocery", "Home",
  "Beauty", "Sports", "Toys", "Books", "Other",
];

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageInput, setImageInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discount: "",
    category: "Electronics",
    brand: "",
    stock: "",
    shopName: "",
    images: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProductById(id);
        const p = data.product;
        setForm({
          name: p.name || "",
          description: p.description || "",
          price: p.price?.toString() || "",
          discount: p.discount?.toString() || "0",
          category: p.category || "Electronics",
          brand: p.brand || "",
          stock: p.stock?.toString() || "0",
          shopName: p.shopName || "",
          images: p.images || [],
        });
      } catch (err) {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const addImage = () => {
    if (!imageInput.trim()) return;
    setForm({ ...form, images: [...form.images, imageInput.trim()] });
    setImageInput("");
  };

  const removeImage = (i) => {
    setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setSaving(true);
      await updateProductApi(id, {
        ...form,
        price: Number(form.price),
        discount: Number(form.discount) || 0,
        stock: Number(form.stock) || 0,
      });
      navigate("/seller/products");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-muted">Loading product...</div>;
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate("/seller/products")}
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-4"
      >
        <FiArrowLeft /> Back to Products
      </button>

      <div className="mb-5">
        <h1 className="font-heading font-bold text-2xl">Edit Product</h1>
        <p className="text-sm text-muted">Update product details</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-5 space-y-5">
        <div>
          <label className="text-sm font-medium mb-1 block">Product Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description *</label>
          <textarea
            required
            rows="4"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            >
              {categoriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Brand</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Price (₹) *</label>
            <input
              type="number"
              required
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Discount (%)</label>
            <input
              type="number"
              min="0"
              max="90"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Stock *</label>
            <input
              type="number"
              required
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Shop Name</label>
          <input
            type="text"
            value={form.shopName}
            onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Image URLs</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage();
                }
              }}
              placeholder="https://example.com/image.jpg"
              className="flex-1 p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
            <button
              type="button"
              onClick={addImage}
              className="px-4 rounded-xl bg-primary text-white font-semibold"
            >
              <FiPlus />
            </button>
          </div>

          {form.images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <FiX className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/seller/products")}
            className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60"
          >
            <FiSave /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;