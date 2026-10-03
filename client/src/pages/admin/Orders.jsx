import { useEffect, useState } from "react";
import { FiTrash2, FiSearch } from "react-icons/fi";
import { fetchAllOrdersAdmin, deleteOrderAdminApi } from "../../services/adminService";

const statusColors = {
  PLACED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-yellow-100 text-yellow-700",
  PACKED: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchAllOrdersAdmin(status === "ALL" ? "" : status);
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await deleteOrderAdminApi(id);
      load();
    } catch (err) {
      alert("Failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl">Orders</h1>
          <p className="text-sm text-muted">{orders.length} orders</p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="p-3 rounded-xl bg-white shadow-card text-sm outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PLACED">Placed</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PACKED">Packed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center text-muted">
          No orders found
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o._id} className="bg-white rounded-xl shadow-card p-4">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-sm">#{o.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {o.user?.name} • {o.user?.email}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[o.orderStatus]}`}>
                  {o.orderStatus.replace(/_/g, " ")}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                {o.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img src={it.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{it.name}</p>
                      <p className="text-xs text-muted">Qty: {it.qty}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-bold text-primary">₹{o.totalAmount}</span>
                <button
                  onClick={() => handleDelete(o._id)}
                  className="p-2 rounded-lg bg-red-50 text-danger hover:bg-red-100"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;