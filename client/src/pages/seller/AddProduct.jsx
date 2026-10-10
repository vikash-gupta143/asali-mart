import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUpload, FiX, FiPlus, FiSave, FiAlertCircle, FiShoppingBag } from "react-icons/fi";
import { createProduct } from "../../services/productService";
import { fetchMyShop } from "../../services/shopService";

const categoriesList = [
  "Electronics", "Fashion", "Grocery", "Home",
  "Beauty", "Sports", "Toys", "Books", "Other",
];

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageInput, setImageInput] = useState("");

  // 🏪 Shop Check
  const [shop, setShop] = useState(null);
  const [checkingShop, setCheckingShop] = useState(true);

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

  // Load shop
  useEffect(() => {
    const check = async () => {
      try {
        const data = await fetchMyShop();
        setShop(data.shop);
        // Auto-fill shop name
        if (data.shop?.name) {
          setForm((prev) => ({ ...prev, shopName: data.shop.name }));
        }
      } catch (err) {
        setShop(null);
      } finally {
        setCheckingShop(false);
      }
    };
    check();
  }, []);

  const addImage = () => {
    if (!imageInput.trim()) return;
    setForm({ ...form, images: [...form.images, imageInput.trim()] });
    setImageInput("");
  };

  const removeImage = (index) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.images.length === 0) {
      setError("Please add at least one image URL");
      return;
    }

    try {
      setLoading(true);
      await createProduct({
        ...form,
        price: Number(form.price),
        discount: Number(form.discount) || 0,
        stock: Number(form.stock) || 0,
      });
      navigate("/seller/products");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  // 🏪 Shop Check Loading
  if (checkingShop) {
    return (
      <div className="text-center py-20 text-muted">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-3 text-sm">Checking shop...</p>
      </div>
    );
  }

  // 🏪 No Shop — Show Prompt
  if (!shop) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-dashed border-yellow-400 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-3xl" />
          </div>

          <h2 className="font-heading font-bold text-xl mb-2 text-dark">
            🏪 Shop Zaroori Hai
          </h2>

          <p className="text-sm text-muted mb-6 max-w-md mx-auto leading-relaxed">
            Product add karne se pehle apni shop banana zaroori hai.
            Iske bina:
          </p>

          <div className="text-left max-w-md mx-auto mb-6 space-y-2">
            <div className="flex items-start gap-2 text-xs text-muted">
              <span className="text-danger mt-0.5">✗</span>
              <span>Nearby customers aapko dhundh nahi payenge</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted">
              <span className="text-danger mt-0.5">✗</span>
              <span>Delivery partner ko pickup address nahi milega</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted">
              <span className="text-danger mt-0.5">✗</span>
              <span>Order flow complete nahi hoga</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/seller/shop"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
            >
              <FiShoppingBag /> Create Shop Now
            </Link>
            <Link
              to="/seller"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-muted font-semibold hover:bg-bg transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Shop Exists — Show Form
  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="font-heading font-bold text-2xl">Add Product</h1>
        <p className="text-sm text-muted">
          Fill the details to list a new product
        </p>
        {shop && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <FiShoppingBag className="text-green-600 text-xs" />
            <span className="text-xs text-green-700 font-medium">
              Adding to: <b>{shop.name}</b>
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-card p-5 space-y-5"
      >
        {/* Name */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Product Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Wireless Bluetooth Headphones"
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Description *
          </label>
          <textarea
            required
            rows="4"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Describe your product..."
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm resize-none"
          />
        </div>

        {/* Category + Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            >
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Brand</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="e.g. SoundMax"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        {/* Price + Discount + Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Price (₹) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="1499"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="90"
              value={form.discount}
              onChange={(e) =>
                setForm({ ...form, discount: e.target.value })
              }
              placeholder="0"
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
              placeholder="10"
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        {/* Shop Name (auto-filled, read-only) */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Shop Name
          </label>
          <input
            type="text"
            value={form.shopName}
            readOnly
            className="w-full p-3 rounded-xl border border-gray-200 bg-bg text-sm text-muted cursor-not-allowed"
          />
          <p className="text-[10px] text-muted mt-1">
            Auto-filled from your shop
          </p>
        </div>

        {/* Images */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Image URLs *{" "}
            <span className="text-muted font-normal">
              (paste link and click +)
            </span>
          </label>

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
              className="px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
            >
              <FiPlus />
            </button>
          </div>

          {form.images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
              {form.images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
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

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/seller/products")}
            className="px-6 py-3 rounded-xl border border-gray-200 font-semibold text-sm hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-60"
          >
            <FiSave /> {loading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;