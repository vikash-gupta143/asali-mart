import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Message type: text, offer, image, system
    type: {
      type: String,
      enum: ["text", "offer", "image", "system"],
      default: "text",
    },
    text: {
      type: String,
      default: "",
    },
    // For offers
    offerAmount: {
      type: Number,
      default: null,
    },
    offerStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "COUNTERED", null],
      default: null,
    },
    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;