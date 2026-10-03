import { FiUser, FiMail, FiPhone, FiShoppingBag } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const SellerProfile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading font-bold text-2xl mb-5">Seller Profile</h1>

      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-6 text-white mb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl">{user?.name}</h2>
            <p className="text-sm text-white/80">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white/20 text-xs font-semibold">
              SELLER
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FiUser />
          </div>
          <div>
            <p className="text-xs text-muted">Name</p>
            <p className="text-sm font-medium">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FiMail />
          </div>
          <div>
            <p className="text-xs text-muted">Email</p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FiPhone />
          </div>
          <div>
            <p className="text-xs text-muted">Phone</p>
            <p className="text-sm font-medium">{user?.phone || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FiShoppingBag />
          </div>
          <div>
            <p className="text-xs text-muted">Role</p>
            <p className="text-sm font-medium">Seller</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;