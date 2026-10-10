// import { Server } from "socket.io";

// let io = null;

// // 🗺️ Track online users (userId → socketId)
// const onlineUsers = new Map();

// export const initSocket = (httpServer) => {
//   io = new Server(httpServer, {
//     cors: {
//       origin: process.env.CLIENT_URL || "http://localhost:5173",
//       credentials: true,
//     },
//   });

//   io.on("connection", (socket) => {
//     console.log("🔌 Socket connected:", socket.id);

//     // User joins with their ID
//     socket.on("join", (userId) => {
//       if (userId) {
//         onlineUsers.set(userId, socket.id);
//         socket.join(`user_${userId}`);
//         console.log(`👤 User ${userId} joined`);
//       }
//     });

//     // Delivery partner goes online
//     socket.on("delivery:online", (userId) => {
//       socket.join("delivery_partners");
//       console.log(`🚚 Delivery partner ${userId} online`);
//     });

//     socket.on("disconnect", () => {
//       // Remove from online users
//       for (const [userId, socketId] of onlineUsers.entries()) {
//         if (socketId === socket.id) {
//           onlineUsers.delete(userId);
//           break;
//         }
//       }
//       console.log("❌ Socket disconnected:", socket.id);
//     });
//   });

//   return io;
// };

// // 📤 Get io instance
// export const getIO = () => {
//   if (!io) {
//     throw new Error("Socket.io not initialized");
//   }
//   return io;
// };

// // 📤 Emit to specific user
// export const emitToUser = (userId, event, data) => {
//   if (io) {
//     io.to(`user_${userId}`).emit(event, data);
//   }
// };

// // 📤 Emit to all delivery partners
// export const emitToDeliveryPartners = (event, data) => {
//   if (io) {
//     io.to("delivery_partners").emit(event, data);
//   }
// };



import { Server } from "socket.io";
import { calculateDistance } from "./delivery.config.js";

let io = null;

// 🗺️ Track online users (userId → socketId)
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("join", (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} joined`);
      }
    });

    socket.on("delivery:online", (userId) => {
      socket.join("delivery_partners");
      console.log(`🚚 Delivery partner ${userId} online`);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const emitToUser = (userId, event, data) => {
  if (io) io.to(`user_${userId}`).emit(event, data);
};

export const emitToDeliveryPartners = (event, data) => {
  if (io) io.to("delivery_partners").emit(event, data);
};

// 🆕 Emit to NEAREST delivery partners (using MongoDB)
export const emitToNearestDeliveryPartners = async (
  event,
  data,
  pickupCoords,
  maxDistance = 5,
  limit = 5
) => {
  if (!io) return;

  // Agar pickup coords nahi hain, toh sabko bhej do
  if (!pickupCoords?.lat || !pickupCoords?.lng) {
    console.log("⚠️ No pickup coords — broadcasting to all");
    io.to("delivery_partners").emit(event, data);
    return;
  }

  try {
    const { lat: pLat, lng: pLng } = pickupCoords;

    // 🆕 MongoDB se online delivery partners ki location uthao
    const DeliveryPartner = (await import("../models/DeliveryPartner.js"))
      .default;

    const onlinePartners = await DeliveryPartner.find({
      status: "APPROVED",
      isAvailable: true,
      currentLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [pLng, pLat],
          },
          $maxDistance: maxDistance * 1000, // km → meters
        },
      },
    })
      .populate("user", "_id name phone")
      .limit(limit);

    if (onlinePartners.length === 0) {
      console.log(
        `⚠️ No partners within ${maxDistance} km — broadcasting to all`
      );
      io.to("delivery_partners").emit(event, data);
      return;
    }

    console.log(
      `🎯 Notifying ${onlinePartners.length} nearest partners (within ${maxDistance} km):`
    );

    onlinePartners.forEach((partner) => {
      const userId = partner.user?._id?.toString();
      if (!userId) return;

      // Distance calculate karo (approx)
      const coords = partner.currentLocation?.coordinates;
      let distance = 0;
      if (coords) {
        distance = calculateDistance(pLat, pLng, coords[1], coords[0]);
      }

      io.to(`user_${userId}`).emit(event, {
        ...data,
        distanceFromPickup: Math.round(distance * 10) / 10,
      });

      console.log(`   → ${partner.user.name} (${distance.toFixed(1)} km)`);
    });
  } catch (err) {
    console.error("❌ Nearest partners error:", err.message);
    // Fallback: sabko bhej do
    io.to("delivery_partners").emit(event, data);
  }
};