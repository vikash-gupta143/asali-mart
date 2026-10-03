import { useEffect, useState } from "react";
import { FiSearch, FiTrash2, FiUserCheck, FiUserX } from "react-icons/fi";
import {
  fetchAllUsers,
  toggleUserStatusApi,
  deleteUserApi,
} from "../../services/adminService";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAllUsers({ role, search });
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [role, search]);

  const handleToggle = async (id) => {
    if (!window.confirm("Change user status?")) return;
    try {
      await toggleUserStatusApi(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try {
      await deleteUserApi(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading font-bold text-2xl">Users</h1>
        <p className="text-sm text-muted">{users.length} users total</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white shadow-card border border-transparent outline-none focus:border-primary text-sm"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="p-3 rounded-xl bg-white shadow-card border border-transparent outline-none focus:border-primary text-sm"
        >
          <option value="ALL">All Roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="SELLER">Sellers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">Loading...</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center text-muted">
          No users found
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg text-muted text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t hover:bg-bg">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                        u.role === "ADMIN" ? "bg-red-100 text-red-700"
                          : u.role === "SELLER" ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${u.isActive ? "text-accent" : "text-danger"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {u.role !== "ADMIN" && (
                          <>
                            <button
                              onClick={() => handleToggle(u._id)}
                              className={`p-2 rounded-lg transition ${
                                u.isActive
                                  ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                              title={u.isActive ? "Deactivate" : "Activate"}
                            >
                              {u.isActive ? <FiUserX /> : <FiUserCheck />}
                            </button>
                            <button
                              onClick={() => handleDelete(u._id)}
                              className="p-2 rounded-lg bg-red-50 text-danger hover:bg-red-100"
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y">
            {users.map((u) => (
              <div key={u._id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm">{u.name}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                    u.role === "ADMIN" ? "bg-red-100 text-red-700"
                      : u.role === "SELLER" ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {u.role}
                  </span>
                </div>
                {u.role !== "ADMIN" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleToggle(u._id)}
                      className="flex-1 py-2 rounded-lg bg-yellow-50 text-yellow-600 text-xs font-semibold"
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="px-3 py-2 rounded-lg bg-red-50 text-danger"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;