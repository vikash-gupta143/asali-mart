import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  connectSocket,
  getSocket,
  joinSocket,
  joinAsDeliveryPartner,
  disconnectSocket,
} from "../services/socketService";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const s = connectSocket();
      setSocket(s);

      // Join as user
      joinSocket(user._id);

      // If delivery partner, join special room
      if (user.role === "DELIVERY_PARTNER") {
        joinAsDeliveryPartner(user._id);
      }

      return () => {
        // Don't disconnect on re-render — only on unmount
      };
    } else {
      disconnectSocket();
      setSocket(null);
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);