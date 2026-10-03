import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DeliveryRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role !== "DELIVERY_PARTNER" && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default DeliveryRoute;