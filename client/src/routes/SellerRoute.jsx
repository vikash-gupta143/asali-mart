import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SellerRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "SELLER" && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SellerRoute;