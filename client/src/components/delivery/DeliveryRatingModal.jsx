import { useState } from "react";
import { FiStar, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../services/api";

const RATING_TAGS = {
  5: [
    { id: "ON_TIME", label: "⏰ On Time" },
    { id: "POLITE", label: "😊 Polite" },
    { id: "PROFESSIONAL", label: "👔 Professional" },
    { id: "CAREFUL_HANDLING", label: "🤲 Careful Handling" },
  ],
  4: [
    { id: "ON_TIME", label: "⏰ On Time" },
    { id: "POLITE", label: "😊 Polite" },
    { id: "PROFESSIONAL", label: "👔 Professional" },
  ],
  3: [
    { id: "LATE_DELIVERY", label: "⏱️ Late Delivery" },
    { id: "UNPROFESSIONAL", label: "😐 Unprofessional" },
  ],
  2: [
    { id: "LATE_DELIVERY", label: "⏱️ Late Delivery" },
    { id: "RUDE", label: "😠 Rude" },
    { id: "UNPROFESSIONAL", label: "😐 Unprofessional" },
  ],
  1: [
    { id: "RUDE", label: "😠 Rude" },
    { id: "UNPROFESSIONAL", label: "😐 Unprofessional" },
    { id: "DAMAGED_PRODUCT", label: "💔 Damaged Product" },
  ],
};

const RATING_LABELS = {
  1: { text: "Bahut Kharab", emoji: "😡" },
  2: { text: "Kharab", emoji: "😞" },
  3: { text: "Theek Hai", emoji: "😐" },
  4: { text: "Achha", emoji: "😊" },
  5: { text: "Bahut Achha", emoji: "🤩" },
};

const DeliveryRatingModal = ({ order, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleTagToggle = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (rating === 0) {
      setError("Kripya rating select karein");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/delivery-ratings", {
        orderId: order._id,
        rating,
        feedback: feedback.trim(),
        tags: selectedTags,
        isAnonymous: false,
      });

      toast.success("Rating submit ho gayi! Thank you 🎉");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Rating submit nahi ho payi");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;
  const activeTags = rating > 0 ? RATING_TAGS[rating] || [] : [];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="font-heading font-bold text-lg">
            ⭐ Rate Your Delivery
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
          >
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Delivery Partner Info */}
          {order.deliveryPartner && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                {order.deliveryPartner.name?.[0]?.toUpperCase() || "D"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-dark">
                  {order.deliveryPartner.name}
                </p>
                <p className="text-xs text-muted">
                  Delivery Partner
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
              <FiAlertCircle /> {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm font-semibold text-dark mb-3">
              Delivery kaisi thi?
            </p>

            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <FiStar
                    className={`text-4xl transition-colors ${
                      star <= displayRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    style={{
                      fill: star <= displayRating ? "#fbbf24" : "transparent",
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Rating Label */}
            {displayRating > 0 && (
              <p className="font-heading font-bold text-lg text-primary">
                {RATING_LABELS[displayRating].emoji}{" "}
                {RATING_LABELS[displayRating].text}
              </p>
            )}
          </div>

          {/* Quick Tags */}
          {activeTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted mb-2">
                Quick Feedback (optional):
              </p>
              <div className="flex flex-wrap gap-2">
                {activeTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-dark hover:bg-gray-200"
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feedback Text */}
          <div>
            <p className="text-xs font-semibold text-muted mb-2">
              Additional Feedback (optional):
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Delivery ke baare me kuch likhein..."
              rows={3}
              maxLength={500}
              className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm resize-none"
            />
            <p className="text-[10px] text-muted text-right mt-1">
              {feedback.length}/500
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 flex gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-sm bg-white hover:bg-gray-100"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <FiCheck /> Submit Rating
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRatingModal;