import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/config/socket.js";

const PORT = process.env.PORT || 5000;

// Connect to DB
connectDB();

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});