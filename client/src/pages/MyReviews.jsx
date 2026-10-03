import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiStar, FiArrowRight } from "react-icons/fi";
import StarRating from "../components/review/StarRating";
import { fetchMyReviews } from "../services/reviewService";

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyReviews();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="container-custom py-10 text-center text-muted">Loading...</div>;

  return (
    <div className="container-custom py-6">
      <h1 className="font-heading font-bold text-2xl mb-5">My Reviews</h1>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiStar className="text-5xl text-muted mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-2">No reviews yet</h3>
          <p className="text-sm text-muted mb-4">
            Review products you've purchased to help others
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            View My Orders <FiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Link
              key={r._id}
              to={`/product/${r.product?._id}`}
              className="flex gap-3 bg-white rounded-xl shadow-card p-4 hover:shadow-hover transition"
            >
              <img
                src={r.product?.images?.[0]}
                alt=""
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {r.product?.name}
                </p>
                <StarRating rating={r.rating} size="text-xs" />
                <p className="text-xs text-muted line-clamp-2 mt-1">
                  {r.comment}
                </p>
              </div>
              <FiArrowRight className="text-muted self-center" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews;