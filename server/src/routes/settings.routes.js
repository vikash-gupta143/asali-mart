import express from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/platformSettings.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getSettings);
router.put("/", protect, authorize("ADMIN"), updateSettings);

export default router;