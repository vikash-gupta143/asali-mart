import { Link } from "react-router-dom";
import { FiMinus, FiPlus, FiTrash2, FiArrowRight, FiShoppingBag } from "react-icons/fi";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const { cart, removeFromCart, updateQty, totalPrice, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <FiShoppingBag className="text-4xl text-primary" />
        </div>
        <h1 className="font-heading font-bold text-2xl mb-2">Your cart is empty</h1>
        <p className="text-sm text-muted mb-6">Add some products to get started</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
        >
          Start Shopping <FiArrowRight />
        </Link>
      </div>
    );
  }

  const delivery = totalPrice > 500 ? 0 : 30;
  const finalTotal = totalPrice + delivery;

  return (
    <div className="container-custom py-6">
      <h1 className="font-heading font-bold text-2xl mb-5">
        Shopping Cart <span className="text-muted text-base">({totalItems} items)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item) => {
            const price = Math.round(item.price - (item.price * item.discount) / 100);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-card p-4 flex gap-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-dark line-clamp-2 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted mb-2">{item.shop}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-dark">₹{price}</span>
                      {item.discount > 0 && (
                        <span className="text-xs text-muted line-through">
                          ₹{item.price}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="p-2 hover:bg-bg"
                        >
                          <FiMinus className="text-xs" />
                        </button>
                        <span className="px-3 text-sm font-semibold">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="p-2 hover:bg-bg"
                        >
                          <FiPlus className="text-xs" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 rounded-lg text-danger hover:bg-red-50 transition"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-card p-5 sticky top-32">
            <h3 className="font-heading font-bold text-lg mb-4">Price Summary</h3>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">₹{totalPrice.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span className={delivery === 0 ? "text-accent font-semibold" : "font-semibold"}>
                  {delivery === 0 ? "FREE" : `₹${delivery}`}
                </span>
              </div>
              {delivery > 0 && (
                <p className="text-xs text-accent">
                  Add ₹{500 - totalPrice} more for FREE delivery
                </p>
              )}
              <div className="border-t pt-3 flex justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">₹{finalTotal.toFixed(0)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition"
            >
              Proceed to Checkout <FiArrowRight />
            </Link>

            <Link
              to="/products"
              className="block text-center text-sm text-primary font-semibold mt-3 hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;