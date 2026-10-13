import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import SellerLayout from "../layouts/SellerLayout";
import AdminLayout from "../layouts/AdminLayout";
import DeliveryLayout from "../layouts/DeliveryLayout";
import SellerRoute from "./SellerRoute";
import AdminRoute from "./AdminRoute";
import DeliveryRoute from "./DeliveryRoute";

import Home from "../pages/Home";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Categories from "../pages/Categories";
import Search from "../pages/Search";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import OrderDetails from "../pages/OrderDetails";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Contact from "../pages/Contact";
import Placeholder from "../pages/Placeholder";
import Shops from "../pages/Shops";
import ShopDetails from "../pages/ShopDetails";
import Chat from "../pages/Chat";
import MyReviews from "../pages/MyReviews";
import Coupons from "../pages/Coupons";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

// Delivery Partner
import BecomePartner from "../pages/delivery/BecomePartner";
import PartnerStatus from "../pages/delivery/Status";
import DeliveryDashboard from "../pages/delivery/Dashboard";
import Available from "../pages/delivery/Available";
import MyDeliveries from "../pages/delivery/MyDeliveries";
import Earnings from "../pages/delivery/Earnings";
import DeliveryWallet from "../pages/delivery/Wallet";


// Seller
import SellerDashboard from "../pages/seller/Dashboard";
import MyShop from "../pages/seller/MyShop";
import MyProducts from "../pages/seller/MyProducts";
import AddProduct from "../pages/seller/AddProduct";
import EditProduct from "../pages/seller/EditProduct";
import SellerProfile from "../pages/seller/SellerProfile";
import SellerOrders from "../pages/seller/SellerOrders";
import ComingSoon from "../pages/seller/ComingSoon";
import SellerEarnings from "../pages/seller/Earnings";
import SellerWallet from "../pages/seller/Wallet"; // 🆕
import SellerReturns from "../pages/seller/SellerReturns"; // 🆕 RETURNS
import SalesAnalytics from "../pages/seller/SalesAnalytics";

// Admin
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";
import AdminProducts from "../pages/admin/Products";
import AdminOrders from "../pages/admin/Orders";
import AdminDeliveryPartners from "../pages/admin/DeliveryPartners";
import AdminCoupons from "../pages/admin/Coupons";
import AdminRevenue from "../pages/admin/Revenue";
import AdminComingSoon from "../pages/admin/ComingSoon";
import AdminShops from "../pages/admin/Shops";
import AdminPayouts from "../pages/admin/Payouts";
import AdminBankVerification from "../pages/admin/BankVerification";
import AdminSettings from "../pages/admin/Settings";
import AdminOrderVerification from "../pages/admin/OrderVerification";
import AdminReturns from "../pages/admin/AdminReturns"; // 🆕 RETURNS

{/* Legal pages */}

import Terms from "../pages/legal/Terms";
import Privacy from "../pages/legal/Privacy";
import Refund from "../pages/legal/Refund";
import Shipping from "../pages/legal/Shipping";
import NotFound from "../pages/NotFound";

// 🆕 Return Pages (Customer)
import ReturnRequest from "../pages/ReturnRequest";
import ReturnDetails from "../pages/ReturnDetails";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ============ MAIN (Customer) ============ */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/search" element={<Search />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetails />} />

        {/* 🆕 RETURN ROUTES (Customer) */}
        <Route path="/return/:orderId" element={<ReturnRequest />} />
        <Route path="/returns/:id" element={<ReturnDetails />} />

        <Route path="/my-reviews" element={<MyReviews />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:id" element={<Chat />} />

        {/* Local Marketplace */}
        <Route path="/shops" element={<Shops />} />
        <Route path="/shops/:id" element={<ShopDetails />} />

        {/* Delivery Partner — public pages */}
        <Route path="/delivery/become-partner" element={<BecomePartner />} />
        <Route path="/delivery/status" element={<PartnerStatus />} />
      </Route>

      {/* ============ SELLER ============ */}
      <Route
        path="/seller"
        element={
          <SellerRoute>
            <SellerLayout />
          </SellerRoute>
        }
      >
        <Route index element={<SellerDashboard />} />
        <Route path="shop" element={<MyShop />} />
        <Route path="products" element={<MyProducts />} />
        <Route path="add-product" element={<AddProduct />} />
        <Route path="edit-product/:id" element={<EditProduct />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="returns" element={<SellerReturns />} /> {/* 🆕 RETURNS */}
        <Route path="analytics" element={<SalesAnalytics />} />
        <Route path="customers" element={<ComingSoon title="Customers" emoji="👥" />} />
        <Route path="sales" element={<ComingSoon title="Sales Analytics" emoji="📊" />} />
        <Route path="profile" element={<SellerProfile />} />
        <Route path="earnings" element={<SellerEarnings />} />
        <Route path="wallet" element={<SellerWallet />} /> {/* 🆕 */}
      </Route>

      {/* ============ ADMIN ============ */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="sellers" element={<AdminUsers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="delivery-partners" element={<AdminDeliveryPartners />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="bank-verification" element={<AdminBankVerification />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="order-verification" element={<AdminOrderVerification />} />
        <Route path="returns" element={<AdminReturns />} /> {/* 🆕 RETURNS */}
        <Route path="payments" element={<AdminComingSoon title="Payments" emoji="💳" />} />
        <Route path="reviews" element={<AdminComingSoon title="Reviews" emoji="⭐" />} />
        <Route path="complaints" element={<AdminComingSoon title="Complaints" emoji="⚠️" />} />
      </Route>

      {/* Legal pages */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/refund" element={<Refund />} />
      <Route path="/shipping" element={<Shipping />} />

      {/* ============ DELIVERY PARTNER ============ */}
      <Route
        path="/delivery"
        element={
          <DeliveryRoute>
            <DeliveryLayout />
          </DeliveryRoute>
        }
      >
        <Route index element={<DeliveryDashboard />} />
        <Route path="available" element={<Available />} />
        <Route path="my-deliveries" element={<MyDeliveries />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="wallet" element={<DeliveryWallet />} />
      </Route>

      {/* 404 — ALWAYS LAST */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;