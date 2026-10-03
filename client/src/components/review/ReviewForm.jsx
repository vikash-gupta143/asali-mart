import { useState } from "react";
import { FiSend, FiX } from "react-icons/fi";
import StarRating from "./StarRating";
import { useAuth } from "../../context/AuthContext";
import { createReviewApi, updateReviewApi } from "../../services/reviewService";

const ReviewForm = ({ productId, existingReview, onSuccess, onCancel }) => {
  const { isAuthenticated } = useAuth();

  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="bg-blue-50 rounded-xl p-4 text-center text-sm">
        <p className="text-blue-700 mb-2">Login to write a review</p>
        <a
          href="/login"
          className="inline-block px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold"
        >
          Login
        </a>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a comment");
      return;
    }

    try {
      setLoading(true);

      if (existingReview) {
        await updateReviewApi(existingReview._id, { rating, title, comment });
      } else {
        await createReviewApi({ productId, rating, title, comment });
      }

      onSuccess?.();
      if (!existingReview) {
        setRating(0);
        setTitle("");
        setComment("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-heading font-bold text-lg">
          {existingReview ? "Edit Your Review" : "Write a Review"}
        </h3>
        {onCancel && (
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-bg">
            <FiX />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Your Rating *
          </label>
          <StarRating
            rating={rating}
            size="text-2xl"
            interactive={true}
            onChange={setRating}
          />
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Excellent product!"
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Your Review *
          </label>
          <textarea
            rows="4"
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-60"
        >
          <FiSend />
          {loading
            ? "Submitting..."
            : existingReview
            ? "Update Review"
            : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;