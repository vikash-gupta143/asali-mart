import { Link } from "react-router-dom";
import { FiHome, FiSearch, FiArrowLeft } from "react-icons/fi";

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl sm:text-9xl font-heading font-extrabold text-primary mb-4">
          404
        </div>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-3">
          Page Not Found
        </h1>
        <p className="text-sm text-muted mb-8">
          Ye page exist nahi karta ya move ho gaya hai.
          Ghabrao mat — kuch aur dhundhte hain!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
          >
            <FiHome /> Back to Home
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 font-semibold hover:bg-bg transition"
          >
            <FiSearch /> Browse Products
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
        >
          <FiArrowLeft /> Go back
        </button>
      </div>
    </div>
  );
};

export default NotFound;