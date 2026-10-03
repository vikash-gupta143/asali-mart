import { Link } from "react-router-dom";
import { FiStar, FiShoppingCart } from "react-icons/fi";
import { useCart } from "../../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  // Backend format — always use _id
  const id = product._id || product.id;
  const name = product.name;
  const image = product.images?.[0] || product.image;
  const price = product.price;
  const discount = product.discount || 0;
  const finalPrice =
    product.finalPrice ?? Math.round(price - (price * discount) / 100);
  const rating = product.rating || 0;
  const shop = product.shopName || product.shop || "AsaliMart";
  const stock = product.stock ?? 0;

  const handleAddToCart = () => {
    if (!id || typeof id !== "string" || id.length !== 24) {
      console.error("❌ Invalid product ID:", id, product);
      alert("Product ID invalid hai. Backend se product load nahi hua.");
      return;
    }

    addToCart({
      _id: id,
      name,
      image,
      price,
      discount,
      finalPrice,
      shopName: shop,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-card hover:shadow-hover transition overflow-hidden group">
      <Link to={`/product/${id}`}>
        <div className="relative aspect-square overflow-hidden bg-bg">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-danger text-white text-[10px] font-bold px-2 py-1 rounded-md">
              {discount}% OFF
            </span>
          )}
          {stock < 10 && stock > 0 && (
            <span className="absolute top-2 right-2 bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded-md">
              Only {stock} left
            </span>
          )}
          {stock === 0 && (
            <span className="absolute top-2 right-2 bg-gray-700 text-white text-[10px] font-bold px-2 py-1 rounded-md">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      <div className="p-3">
        <p className="text-[10px] text-muted mb-1">{shop}</p>
        <Link to={`/product/${id}`}>
          <h3 className="font-medium text-sm text-dark line-clamp-2 mb-1 hover:text-primary transition">
            {name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-2">
          <FiStar className="text-yellow-400 fill-yellow-400 text-xs" />
          <span className="text-xs text-muted">{rating || "New"}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-dark">₹{finalPrice}</span>
            {discount > 0 && (
              <span className="text-xs text-muted line-through ml-1">₹{price}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={stock === 0}
            className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition disabled:opacity-40"
          >
            <FiShoppingCart className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;