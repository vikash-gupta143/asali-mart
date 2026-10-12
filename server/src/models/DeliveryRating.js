import mongoose from "mongoose";

const deliveryRatingSchema = new mongoose.Schema(
  {
    // 🔗 References
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ⭐ Rating (1-5)
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },

    // 📝 Feedback
    feedback: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // 🏷️ Quick Tags (optional)
    tags: [
      {
        type: String,
        enum: [
          "ON_TIME",
          "POLITE",
          "PROFESSIONAL",
          "CAREFUL_HANDLING",
          "LATE_DELIVERY",
          "RUDE",
          "UNPROFESSIONAL",
          "DAMAGED_PRODUCT",
        ],
      },
    ],

    // 📊 Metadata
    isAnonymous: {
      type: Boolean,
      default: false,
    },

    // 🎯 Rating Type
    deliveryType: {
      type: String,
      enum: ["ORDER_DELIVERY", "RETURN_PICKUP"],
      default: "ORDER_DELIVERY",
    },
  },
  { timestamps: true }
);

// 🚫 Prevent duplicate ratings for same order
deliveryRatingSchema.index(
  { order: 1, deliveryPartner: 1 },
  { unique: true }
);

const DeliveryRating = mongoose.model("DeliveryRating", deliveryRatingSchema);
export default DeliveryRating;