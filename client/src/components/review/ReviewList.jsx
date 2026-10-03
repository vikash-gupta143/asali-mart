import { useState } from "react";
import {
  FiThumbsUp, FiCheckCircle, FiEdit2, FiTrash2, FiMessageSquare,
} from "react-icons/fi";
import StarRating from "./StarRating";
import { useAuth } from "../../context/AuthContext";
import { markHelpfulApi, deleteReviewApi } from "../../services/reviewService";

const ReviewList = ({ reviews, onEdit, onRefresh }) => {
  const { user } = useAuth();

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 text-center">
        <FiMessageSquare className="text-4xl text-muted mx-auto mb-3" />
        <p className="text-sm text-muted">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard
          key={review._id}
          review={review}
          currentUser={user}
          onEdit={onEdit}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

const ReviewCard = ({ review, currentUser, onEdit, onRefresh }) => {
  const [helpfulLoading, setHelpfulLoading] = useState(false);
  const [isHelpful, setIsHelpful] = useState(
    review.helpfulBy?.some((id) => id === currentUser?._id) || false
  );
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);

  const isOwn = currentUser?._id === review.user?._id;

  const handleHelpful = async () => {
    if (!currentUser) {
      alert("Login to mark helpful");
      return;
    }
    try {
      setHelpfulLoading(true);
      const data = await markHelpfulApi(review._id);
      setHelpfulCount(data.helpfulCount);
      setIsHelpful(data.isHelpful);
    } catch (err) {
      alert("Failed");
    } finally {
      setHelpfulLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReviewApi(review._id);
      onRefresh?.();
    } catch (err) {
      alert("Failed");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
            {review.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-semibold text-sm">{review.user?.name || "Anonymous"}</p>
            <p className="text-xs text-muted">
              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {review.isVerifiedPurchase && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-semibold">
            <FiCheckCircle className="text-xs" /> Verified
          </span>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-2">
        <StarRating rating={review.rating} size="text-sm" />
        {review.title && (
          <p className="font-semibold text-sm">{review.title}</p>
        )}
      </div>

      {/* Comment */}
      <p className="text-sm text-muted leading-relaxed mb-3">
        {review.comment}
      </p>

      {/* Seller response */}
      {review.sellerResponse?.text && (
        <div className="p-3 rounded-lg bg-blue-50 border-l-4 border-blue-400 mb-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">
            🏪 Seller Response
          </p>
          <p className="text-xs text-blue-900">{review.sellerResponse.text}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t">
        <button
          onClick={handleHelpful}
          disabled={helpfulLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            isHelpful
              ? "bg-primary/10 text-primary"
              : "text-muted hover:bg-bg"
          }`}
        >
          <FiThumbsUp /> Helpful ({helpfulCount})
        </button>

        {isOwn && (
          <>
            <button
              onClick={() => onEdit?.(review)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              <FiEdit2 /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-red-50"
            >
              <FiTrash2 /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewList;