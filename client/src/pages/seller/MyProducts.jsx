import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiPlusCircle, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";
import {
  fetchMyProducts,
  deleteProductApi,
} from "../../services/productService";

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchMyProducts();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      setDeleting(id);
      await deleteProductApi(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="font-heading font-bold text-2xl">My Products</h1>
          <p className="text-sm text-muted">{products.length} products total</p>
        </div>
        <Link
          to="/seller/add-product"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition"
        >
          <FiPlusCircle /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white shadow-card border border-transparent outline-none focus:border-primary text-sm"
        />
      </div>

      {/* Products */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-muted">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-12 text-center">
          <FiPlusCircle className="text-5xl text-muted mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg mb-2">No products</h3>
          <p className="text-sm text-muted mb-4">
            {search ? "No products match your search" : "Start by adding your first product"}
          </p>
          {!search && (
            <Link
              to="/seller/add-product"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
            >
              <FiPlusCircle /> Add Product
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg text-muted text-xs">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Product</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 font-semibold">Price</th>
                  <th className="text-left px-4 py-3 font-semibold">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-t hover:bg-bg transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0]}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-muted">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.category}</td>
                    <td className="px-4 py-3 font-semibold">
                      ₹{p.finalPrice ?? p.price}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.stock === 0
                            ? "text-danger font-semibold"
                            : p.stock < 10
                            ? "text-orange-500 font-semibold"
                            : "text-accent font-semibold"
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-md ${
                          p.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/seller/edit-product/${p._id}`}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          <FiEdit2 />
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id)}
                          disabled={deleting === p._id}
                          className="p-2 rounded-lg bg-red-50 text-danger hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y">
            {filtered.map((p) => (
              <div key={p._id} className="p-4 flex gap-3">
                <img
                  src={p.images?.[0]}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted mb-1">{p.category}</p>
                  <p className="font-semibold text-sm">₹{p.finalPrice ?? p.price}</p>
                  <p className="text-xs mt-1">
                    Stock:{" "}
                    <span className={p.stock === 0 ? "text-danger" : "text-accent"}>
                      {p.stock}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/seller/edit-product/${p._id}`}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600"
                  >
                    <FiEdit2 className="text-sm" />
                  </Link>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-2 rounded-lg bg-red-50 text-danger"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProducts;