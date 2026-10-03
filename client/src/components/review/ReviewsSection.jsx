import { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import RatingBreakdown from "./RatingBreakdown";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import { fetchProductReviews } from "../../services/reviewService";

const ReviewsSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [breakdown, setBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchProductReviews(productId);
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating || 0);
      setBreakdown(data.breakdown || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) load();
  }, [productId]);

  const handleEdit = (review) => {
    setEditingReview(review);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingReview(null);
    load();
  };

  return (
    <section className="mt-12">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-heading font-bold text-xl">
          Ratings & Reviews
        </h2>
        {!showForm && (
          <button
            onClick={() => {
              setEditingReview(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition"
          >
            <FiPlus /> Write Review
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Breakdown */}
        <div className="lg:col-span-1">
          <RatingBreakdown
            avgRating={avgRating}
            count={reviews.length}
            breakdown={breakdown}
          />
        </div>

        {/* Right — Form / List */}
        <div className="lg:col-span-2 space-y-4">
          {showForm && (
            <ReviewForm
              productId={productId}
              existingReview={editingReview}
              onSuccess={handleSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingReview(null);
              }}
            />
          )}

          {loading ? (
            <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
              Loading reviews...
            </div>
          ) : (
            <ReviewList
              reviews={reviews}
              onEdit={handleEdit}
              onRefresh={load}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;