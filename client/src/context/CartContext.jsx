import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("asali_cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("asali_cart", JSON.stringify(cart));
  }, [cart]);

  // ✅ Helper — har item ka unique id nikaalo
  const getItemId = (item) => item._id || item.id;

  const addToCart = (product, qty = 1) => {
    const productId = getItemId(product);
    if (!productId) {
      console.error("❌ addToCart: no _id or id in product", product);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => getItemId(item) === productId);

      if (existing) {
        // Pehle se cart me hai — qty badhao
        return prev.map((item) =>
          getItemId(item) === productId
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }

      // Naya item — cart me add karo
      return [
        ...prev,
        {
          _id: productId,
          name: product.name,
          image: product.image || product.images?.[0],
          price: product.price,
          discount: product.discount || 0,
          finalPrice:
            product.finalPrice ??
            Math.round(product.price - (product.price * (product.discount || 0)) / 100),
          shopName: product.shopName,
          stock: product.stock,
          qty,
        },
      ];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => getItemId(item) !== id));
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        getItemId(item) === id ? { ...item, qty } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const price =
      item.finalPrice ??
      Math.round(item.price - (item.price * (item.discount || 0)) / 100);
    return sum + price * item.qty;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);