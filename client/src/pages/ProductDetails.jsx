import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiStar, FiShoppingCart, FiHeart, FiTruck, FiShield,
  FiRefreshCw, FiMinus, FiPlus, FiArrowLeft, FiMessageCircle,
} from "react-icons/fi";
import ProductCard from "../components/common/ProductCard";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { fetchProductById, fetchProducts } from "../services/productService";
import { createOrGetChatApi } from "../services/chatService";
import ReviewsSection from "../components/review/ReviewsSection";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProductById(id);
        setProduct(data.product);

        // Load related products (same category)
        const relData = await fetchProducts({
          category: data.product.category,
          limit: 4,
        });
        setRelated(
          relData.products.filter((p) => p._id !== data.product._id).slice(0, 4)
        );
      } catch (err) {
        setError(err.response?.data?.message || "Product not found");
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  // ✅ Add to Cart
  const handleAddToCart = () => {
    if (!product || !product._id) {
      alert("Product ID missing. Please reload.");
      return;
    }

    const finalPrice =
      product.finalPrice ??
      Math.round(product.price - (product.price * (product.discount || 0)) / 100);

    addToCart(
      {
        _id: product._id,
        name: product.name,
        image: product.images?.[0],
        price: product.price,
        discount: product.discount,
        finalPrice,
        shopName: product.shopName,
        stock: product.stock,
      },
      qty
    );
  };

  // 💬 Chat with Seller
  const handleChatWithSeller = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!product?.seller) {
      alert("Seller information not available");
      return;
    }

    const sellerId =
      typeof product.seller === "object" ? product.seller._id : product.seller;

    if (sellerId === user._id) {
      alert("You cannot chat with yourself");
      return;
    }

    try {
      setChatLoading(true);
      const data = await createOrGetChatApi(sellerId, product._id);
      navigate(`/chat/${data.chat._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start chat");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="font-heading font-bold text-2xl mb-2">
          {error || "Product not found"}
        </h1>
        <Link to="/products" className="text-primary font-semibold hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  const price = product.price;
  const discount = product.discount || 0;
  const finalPrice =
    product.finalPrice ?? Math.round(price - (price * discount) / 100);

  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : ["https://via.placeholder.com/500"];

  return (
    <div className="container-custom py-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-4"
      >
        <FiArrowLeft /> Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="bg-white rounded-2xl shadow-card overflow-hidden aspect-square">
            <img
              src={gallery[activeImg]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3 mt-3">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                    activeImg === i ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs text-muted mb-1">
            Sold by{" "}
            <span className="text-primary font-semibold">
              {product.shopName || "AsaliMart"}
            </span>
          </p>
          <h1 className="font-heading font-bold text-2xl mb-2">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50">
              <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
              <span className="text-xs font-semibold text-green-700">
                {product.rating || "New"}
              </span>
            </div>
            <span className="text-xs text-muted">
              {product.numReviews || 0} reviews
            </span>
            <span className="text-xs text-muted">• {product.brand}</span>
          </div>

          <div className="flex items-end gap-3 mb-5">
            <span className="font-heading font-bold text-3xl text-dark">
              ₹{finalPrice}
            </span>
            {discount > 0 && (
              <>
                <span className="text-muted line-through">₹{price}</span>
                <span className="text-accent font-semibold text-sm">
                  {discount}% off
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-muted mb-5 leading-relaxed">
            {product.description}
          </p>

          <p className="text-xs mb-4">
            {product.stock > 10 ? (
              <span className="text-accent font-semibold">✓ In Stock</span>
            ) : product.stock > 0 ? (
              <span className="text-danger font-semibold">
                ⚠ Only {product.stock} left
              </span>
            ) : (
              <span className="text-danger font-semibold">✗ Out of Stock</span>
            )}
          </p>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-3 hover:bg-bg"
              >
                <FiMinus />
              </button>
              <span className="px-5 font-semibold">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="p-3 hover:bg-bg"
              >
                <FiPlus />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50"
            >
              <FiShoppingCart /> Add to Cart
            </button>
            <button className="p-3 rounded-xl border border-gray-200 hover:border-primary hover:text-primary transition">
              <FiHeart />
            </button>
          </div>

          {/* 💬 Chat with Seller */}
          <button
            onClick={handleChatWithSeller}
            disabled={chatLoading || product.stock === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition disabled:opacity-50 mb-5"
          >
            <FiMessageCircle />
            {chatLoading ? "Opening chat..." : "💬 Chat & Bargain with Seller"}
          </button>

          <div className="grid grid-cols-3 gap-3 pt-5 border-t border-gray-100">
            {[
              { icon: FiTruck, text: "Fast Delivery" },
              { icon: FiShield, text: "Secure" },
              { icon: FiRefreshCw, text: "Easy Return" },
            ].map((b, i) => (
              <div key={i} className="text-center">
                <b.icon className="text-primary text-xl mx-auto mb-1" />
                <p className="text-xs text-muted">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ⭐ Reviews Section */}
      <ReviewsSection productId={product._id} />

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading font-bold text-xl mb-5">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;