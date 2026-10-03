import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// @desc    Get or create chat with another user
// @route   POST /api/chats
// @access  Private
export const createOrGetChat = async (req, res, next) => {
  try {
    const { userId, productId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required",
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot chat with yourself",
      });
    }

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const chat = await Chat.findOrCreate(req.user._id, userId, productId || null);

    const populated = await Chat.findById(chat._id)
      .populate("participants", "name email role avatar")
      .populate("product", "name images price");

    res.json({ success: true, chat: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my chats
// @route   GET /api/chats
// @access  Private
export const getMyChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name email role avatar")
      .populate("product", "name images price")
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, count: chats.length, chats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages in a chat
// @route   GET /api/chats/:id/messages
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    if (!chat.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const messages = await Message.find({ chat: req.params.id })
      .populate("sender", "name avatar role")
      .sort({ createdAt: 1 });

    // Mark all as read
    await Message.updateMany(
      { chat: req.params.id, sender: { $ne: req.user._id } },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/chats/:id/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { text, type = "text", offerAmount } = req.body;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    if (!chat.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const messageData = {
      chat: chat._id,
      sender: req.user._id,
      type,
      text: text || "",
    };

    if (type === "offer") {
      if (!offerAmount || offerAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid offer amount required",
        });
      }
      messageData.offerAmount = offerAmount;
      messageData.offerStatus = "PENDING";
    }

    const message = await Message.create(messageData);
    const populated = await Message.findById(message._id).populate(
      "sender",
      "name avatar role"
    );

    // Update chat
    chat.lastMessage =
      type === "offer" ? `💰 Offer: ₹${offerAmount}` : text;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to an offer
// @route   PUT /api/chats/messages/:messageId/offer
// @access  Private
export const respondToOffer = async (req, res, next) => {
  try {
    const { action, counterAmount } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message || message.type !== "offer") {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    if (!chat.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (message.sender.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot respond to your own offer",
      });
    }

    if (action === "accept") {
      message.offerStatus = "ACCEPTED";
    } else if (action === "reject") {
      message.offerStatus = "REJECTED";
    } else if (action === "counter") {
      message.offerStatus = "COUNTERED";

      // Create counter offer message
      await Message.create({
        chat: chat._id,
        sender: req.user._id,
        type: "offer",
        text: `Counter offer: ₹${counterAmount}`,
        offerAmount: counterAmount,
        offerStatus: "PENDING",
      });

      chat.lastMessage = `💰 Counter: ₹${counterAmount}`;
      chat.lastMessageAt = new Date();
      await chat.save();
    } else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    await message.save();

    res.json({
      success: true,
      message: "Offer updated",
      offer: message,
    });
  } catch (error) {
    next(error);
  }
};