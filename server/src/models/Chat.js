import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // Product context (optional — kisi product ke baare me baat)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    // Last message preview
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Unread count per user
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Find or create chat between two users
chatSchema.statics.findOrCreate = async function (user1, user2, productId = null) {
  let chat = await this.findOne({
    participants: { $all: [user1, user2] },
    product: productId,
  });

  if (!chat) {
    chat = await this.create({
      participants: [user1, user2],
      product: productId,
    });
  }

  return chat;
};

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;