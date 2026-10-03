import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FiMapPin, FiPhone, FiStar, FiArrowLeft } from "react-icons/fi";
import ProductCard from "../components/common/ProductCard";
import { fetchShopById } from "../services/shopService";

const ShopDetails = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchShopById(id);
        setShop(data.shop);
        setProducts(data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="container-custom py-10 text-center">Loading...</div>;
  if (!shop) return <div className="container-custom py-10 text-center">Shop not found</div>;

  return (
    <div className="container-custom py-6">
      <Link
        to="/shops"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-4"
      >
        <FiArrowLeft /> Back to Shops
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-primary to-primary-light" />
        <div className="p-6 -mt-12 relative">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-card border-4 border-white flex items-center justify-center text-primary font-bold text-3xl mb-3">
            {shop.name[0]}
          </div>
          <h1 className="font-heading font-bold text-2xl">{shop.name}</h1>
          <p className="text-sm text-muted mb-3">{shop.description}</p>

          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1">
              <FiStar className="text-yellow-400 fill-yellow-400" />
              {shop.rating || "New"} ({shop.numReviews || 0} reviews)
            </span>
            <span className="flex items-center gap-1 text-muted">
              <FiMapPin className="text-primary" />
              {shop.address?.city || "—"}
            </span>
            <span className="flex items-center gap-1 text-muted">
              <FiPhone className="text-primary" />
              {shop.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="font-heading font-bold text-xl mb-4">
        Products ({products.length})
      </h2>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center text-muted">
          No products in this shop yet
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopDetails;