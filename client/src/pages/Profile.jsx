import {
  FiUser, FiMail, FiPhone, FiMapPin, FiLogOut,
  FiPackage, FiHeart, FiSettings, FiChevronRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user: authUser, logout } = useAuth();
const user = authUser || {
  name: "Guest",
  email: "guest@example.com",
  phone: "—",
  role: "GUEST",
  address: "—",
};

  const menuItems = [
    { icon: FiPackage, label: "My Orders", desc: "Track your orders", path: "/orders" },
    { icon: FiHeart, label: "Wishlist", desc: "Saved items", path: "#" },
    { icon: FiMapPin, label: "Addresses", desc: "Manage delivery addresses", path: "#" },
    { icon: FiSettings, label: "Settings", desc: "Account preferences", path: "#" },
  ];

  return (
    <div className="container-custom py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white mb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user.name[0]}
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl">{user.name}</h1>
            <p className="text-sm text-white/80">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white/20 text-xs font-semibold">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold mb-4">Personal Info</h3>
            <div className="space-y-3">
              {[
                { icon: FiUser, label: "Name", value: user.name },
                { icon: FiMail, label: "Email", value: user.email },
                { icon: FiPhone, label: "Phone", value: user.phone },
                { icon: FiMapPin, label: "Address", value: user.address },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <r.icon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted">{r.label}</p>
                    <p className="text-sm font-medium truncate">{r.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 rounded-xl border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition">
              Edit Profile
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-card p-5">
            <h3 className="font-heading font-bold mb-3">Quick Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Orders", value: 12, color: "text-primary" },
                { label: "Wishlist", value: 5, color: "text-danger" },
                { label: "Reviews", value: 8, color: "text-accent" },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 rounded-xl bg-bg">
                  <p className={`font-heading font-bold text-2xl ${s.color}`}>
                    {s.value}
                  </p>
                  <p className="text-xs text-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Menu */}
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3 hover:shadow-hover transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <item.icon />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
              <FiChevronRight className="text-muted group-hover:text-primary group-hover:translate-x-1 transition" />
            </Link>
          ))}

          <button  onClick={logout}
             className="w-full bg-white rounded-xl shadow-card p-4 flex items-center gap-3 hover:shadow-hover transition text-danger">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <FiLogOut />
            </div>
            <span className="font-semibold text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;