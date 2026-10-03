import express from "express";
import {
  createOrGetChat,
  getMyChats,
  getMessages,
  sendMessage,
  respondToOffer,
} from "../controllers/chat.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createOrGetChat);
router.get("/", getMyChats);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.put("/messages/:messageId/offer", respondToOffer);

export default router;