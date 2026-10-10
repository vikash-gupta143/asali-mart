import { io } from "socket.io-client";

let socket = null;

// 🔌 Connect to socket
export const connectSocket = () => {
  if (socket) return socket;

  const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  return socket;
};

// 📤 Get socket
export const getSocket = () => socket;

// 📤 Join as user
export const joinSocket = (userId) => {
  if (socket && userId) {
    socket.emit("join", userId);
  }
};

// 📤 Join as delivery partner
export const joinAsDeliveryPartner = (userId) => {
  if (socket && userId) {
    socket.emit("delivery:online", userId);
  }
};

// 🔌 Disconnect
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};