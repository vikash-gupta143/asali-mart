import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid, FiPackage, FiPlusCircle, FiShoppingBag,
  FiUsers, FiBarChart2, FiUser, FiLogOut, FiHome,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const SellerLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    { name: "Dashboard", path: "/seller", icon: FiGrid },
    { name: "My Products", path: "/seller/products", icon: FiPackage },
    { name: "Add Product", path: "/seller/add-product", icon: FiPlusCircle },
    { name: "Orders", path: "/seller/orders", icon: FiShoppingBag },
    { name: "Customers", path: "/seller/customers", icon: FiUsers },
    { name: "Sales", path: "/seller/sales", icon: FiBarChart2 },
    { name: "Profile", path: "/seller/profile", icon: FiUser },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-white hidden lg:flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-lg">
              A
            </div>
            <div>
              <p className="font-heading font-bold">
                Asali<span className="text-primary">Mart</span>
              </p>
              <p className="text-[10px] text-gray-400">Seller Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  active
                    ? "bg-primary text-white font-semibold"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <item.icon /> {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-bold">
              {user?.name?.[0]?.toUpperCase() || "S"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5"
          >
            <FiHome /> Back to Store
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-danger hover:bg-red-500/10"
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-secondary text-white z-40 px-4 py-3 flex justify-between items-center">
        <Link to="/seller" className="font-heading font-bold">
          Asali<span className="text-primary">Mart</span> Seller
        </Link>
        <button onClick={handleLogout} className="text-danger text-sm">
          Logout
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0">
        {/* Mobile menu bar */}
        <div className="lg:hidden bg-white border-b px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {menu.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    active ? "bg-primary text-white" : "bg-bg text-muted"
                  }`}
                >
                  <item.icon /> {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerLayout;