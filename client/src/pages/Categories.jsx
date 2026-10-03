import { Link } from "react-router-dom";
import { categories, products } from "../data/products";

const Categories = () => {
  return (
    <div className="container-custom py-6">
      <h1 className="font-heading font-bold text-2xl mb-6">All Categories</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const count = products.filter((p) => p.category === cat.name).length;
          return (
            <Link
              key={cat.id}
              to={`/products?category=${cat.name}`}
              className="bg-white rounded-2xl shadow-card hover:shadow-hover transition p-6 text-center group"
            >
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-3 group-hover:scale-110 transition"
                style={{ backgroundColor: cat.color }}
              >
                {cat.icon}
              </div>
              <h3 className="font-heading font-semibold text-dark">{cat.name}</h3>
              <p className="text-xs text-muted mt-1">{count} products</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;