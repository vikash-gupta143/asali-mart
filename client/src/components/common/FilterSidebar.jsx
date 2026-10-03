import { FiX } from "react-icons/fi";

const FilterSidebar = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  sortBy,
  setSortBy,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 h-full lg:h-auto w-72 bg-white lg:bg-transparent z-50 lg:z-0 p-5 lg:p-0 overflow-y-auto transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex justify-between items-center mb-5 lg:hidden">
          <h3 className="font-heading font-bold text-lg">Filters</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg">
            <FiX />
          </button>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl shadow-card p-4 mb-4">
          <h4 className="font-heading font-semibold mb-3 text-sm">Category</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === "All"}
                onChange={() => setSelectedCategory("All")}
                className="accent-primary"
              />
              All
            </label>
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat.name}
                  onChange={() => setSelectedCategory(cat.name)}
                  className="accent-primary"
                />
                {cat.icon} {cat.name}
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="bg-white rounded-xl shadow-card p-4 mb-4">
          <h4 className="font-heading font-semibold mb-3 text-sm">Price Range</h4>
          <input
            type="range"
            min="0"
            max="5000"
            step="100"
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>₹0</span>
            <span className="font-semibold text-primary">₹{priceRange}</span>
            <span>₹5000</span>
          </div>
        </div>

        {/* Sort */}
        <div className="bg-white rounded-xl shadow-card p-4">
          <h4 className="font-heading font-semibold mb-3 text-sm">Sort By</h4>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary"
          >
            <option value="popular">Popular</option>
            <option value="low-high">Price: Low → High</option>
            <option value="high-low">Price: High → Low</option>
            <option value="rating">Top Rated</option>
            <option value="discount">Highest Discount</option>
          </select>
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;