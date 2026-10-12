// 🎯 Category-based Return Reasons

export const RETURN_REASONS = {
  // 🥦 Grocery / Perishables
  GROCERY: [
    { id: "EXPIRED", label: "Product expired hai", icon: "📅" },
    { id: "DAMAGED", label: "Product damaged hai", icon: "💔" },
    { id: "WRONG_ITEM", label: "Galat item aaya", icon: "❌" },
    { id: "MISSING_ITEM", label: "Item missing tha", icon: "📭" },
    { id: "QUALITY_POOR", label: "Quality kharab hai", icon: "⚠️" },
    { id: "QUANTITY_LESS", label: "Quantity kam hai", icon: "📉" },
    { id: "OTHER", label: "Aur kuch", icon: "💬" },
  ],

  // 👕 Clothing / Fashion / Footwear
  CLOTHING: [
    { id: "SIZE_ISSUE", label: "Size sahi nahi hai", icon: "📏" },
    { id: "FIT_ISSUE", label: "Fitting sahi nahi hai", icon: "🧵" },
    { id: "COLOR_DIFF", label: "Color different hai", icon: "🎨" },
    { id: "FABRIC_QUALITY", label: "Fabric quality kharab", icon: "🧶" },
    { id: "DAMAGED", label: "Product damaged hai", icon: "💔" },
    { id: "WRONG_ITEM", label: "Galat product aaya", icon: "❌" },
    { id: "NOT_AS_DESCRIBED", label: "Description se alag", icon: "📝" },
    { id: "OTHER", label: "Aur kuch", icon: "💬" },
  ],

  // 📱 Electronics / Gadgets
  ELECTRONICS: [
    { id: "NOT_WORKING", label: "Product kaam nahi kar raha", icon: "🔌" },
    { id: "DAMAGED", label: "Product damaged hai", icon: "💔" },
    { id: "DEFECTIVE", label: "Defective hai", icon: "⚙️" },
    { id: "WRONG_ITEM", label: "Galat product aaya", icon: "❌" },
    { id: "MISSING_PARTS", label: "Parts missing hain", icon: "📦" },
    { id: "NOT_AS_DESCRIBED", label: "Description se alag", icon: "📝" },
    { id: "WARRANTY_ISSUE", label: "Warranty issue", icon: "📜" },
    { id: "OTHER", label: "Aur kuch", icon: "💬" },
  ],

  // 💄 Cosmetics / Beauty
  COSMETICS: [
    { id: "EXPIRED", label: "Product expired hai", icon: "📅" },
    { id: "DAMAGED", label: "Product damaged hai", icon: "💔" },
    { id: "WRONG_SHADE", label: "Shade galat hai", icon: "🎨" },
    { id: "ALLERGIC", label: "Allergy ho gayi", icon: "🤧" },
    { id: "LEAKED", label: "Product leak ho gaya", icon: "💧" },
    { id: "NOT_AS_DESCRIBED", label: "Description se alag", icon: "📝" },
    { id: "OTHER", label: "Aur kuch", icon: "💬" },
  ],

  // 📚 Books / Stationery
  BOOKS: [
    { id: "DAMAGED", label: "Book damaged hai", icon: "💔" },
    { id: "WRONG_BOOK", label: "Galat book aayi", icon: "❌" },
    { id: "PAGES_MISSING", label: "Pages missing hain", icon: "📄" },
    { id: "PRINT_QUALITY", label: "Print quality kharab", icon: "🖨️" },
    { id: "WRONG_EDITION", label: "Edition galat hai", icon: "📚" },
    { id: "OTHER", label: "Aur kuch", icon: "💬" },
  ],

  // 🏠 Home / Kitchen
  HOME: [
    { id: "DAMAGED", label: "Product damaged hai", icon: "💔" },
    { id: "BROKEN", label: "Toot gaya hai", icon: "🔨" },
    { id: "WRONG_ITEM", label: "Galat item aaya", icon: "❌" },
    { id: "SIZE_ISSUE", label: "Size sahi nahi", icon: "📏" },
    { id: "QUALITY_POOR", label: "Quality kharab", icon: "⚠️" },
    { id: "OTHER", label: "Aur kuch", icon: "💬" },
  ],

  // ⚽ Sports / Fitness
  SPORTS: [
    { id: "DAMAGED", label: "Product damaged hai", icon: "💔" },
    { id: "WRONG_ITEM", label: "Galat product aaya", icon: "❌" },
    { id: "SIZE_ISSUE", label: "Size sahi nahi", icon: "📏" },
    { id: "QUALITY_POOR", label: "Quality kharab", icon: "⚠️" },
    { id: "OTHER", label: "Aur kuch", icon: "💬" },
  ],

  // 🧸 Toys / Baby
  TOYS: [
    { id: "DAMAGED", label: "Product damaged hai", icon: "💔" },
    { id: "BROKEN", label: "Toot gaya hai", icon: "🔨" },
    { id: "WRONG_ITEM", label: "Galat item aaya", icon: "❌" },
    { id: "MISSING_PARTS", label: "Parts missing hain", icon: "📦" },
    { id: "QUALITY_POOR", label: "Quality kharab", icon: "⚠️" },
    { id: "OTHER", label: "Aur kuch", icon: "💬" },
  ],

  // 🎁 Default (fallback)
  DEFAULT: [
    { id: "DAMAGED", label: "Product damaged hai", icon: "💔" },
    { id: "WRONG_PRODUCT", label: "Galat product aaya", icon: "❌" },
    { id: "NOT_AS_DESCRIBED", label: "Description se alag hai", icon: "📝" },
    { id: "QUALITY_ISSUE", label: "Quality issue hai", icon: "⚠️" },
    { id: "OTHER", label: "Aur kuch", icon: "💬" },
  ],
};

/**
 * Category ke hisaab se reasons laao
 * @param {string} categoryName - Product category ka naam (jaise "Grocery", "Electronics")
 * @returns {Array} Reasons array
 */
export const getReasonsByCategory = (categoryName) => {
  if (!categoryName) return RETURN_REASONS.DEFAULT;

  const cat = String(categoryName).toLowerCase().trim();

  // 🥦 Grocery
  if (
    cat.includes("grocery") ||
    cat.includes("food") ||
    cat.includes("vegetable") ||
    cat.includes("fruit") ||
    cat.includes("dairy") ||
    cat.includes("snack") ||
    cat.includes("beverage") ||
    cat.includes("bakery") ||
    cat.includes("meat") ||
    cat.includes("kirana")
  ) {
    return RETURN_REASONS.GROCERY;
  }

  // 👕 Clothing
  if (
    cat.includes("cloth") ||
    cat.includes("fashion") ||
    cat.includes("wear") ||
    cat.includes("shirt") ||
    cat.includes("pant") ||
    cat.includes("jeans") ||
    cat.includes("dress") ||
    cat.includes("saree") ||
    cat.includes("kurta") ||
    cat.includes("top") ||
    cat.includes("t-shirt") ||
    cat.includes("tshirt") ||
    cat.includes("shoe") ||
    cat.includes("footwear") ||
    cat.includes("sandal") ||
    cat.includes("slipper") ||
    cat.includes("apparel")
  ) {
    return RETURN_REASONS.CLOTHING;
  }

  // 📱 Electronics
  if (
    cat.includes("electronic") ||
    cat.includes("mobile") ||
    cat.includes("phone") ||
    cat.includes("laptop") ||
    cat.includes("computer") ||
    cat.includes("gadget") ||
    cat.includes("tv") ||
    cat.includes("television") ||
    cat.includes("camera") ||
    cat.includes("headphone") ||
    cat.includes("earphone") ||
    cat.includes("charger") ||
    cat.includes("cable") ||
    cat.includes("speaker") ||
    cat.includes("smartwatch") ||
    cat.includes("tablet") ||
    cat.includes("appliance")
  ) {
    return RETURN_REASONS.ELECTRONICS;
  }

  // 💄 Cosmetics
  if (
    cat.includes("cosmetic") ||
    cat.includes("beauty") ||
    cat.includes("makeup") ||
    cat.includes("make-up") ||
    cat.includes("skin") ||
    cat.includes("hair") ||
    cat.includes("perfume") ||
    cat.includes("fragrance") ||
    cat.includes("lipstick") ||
    cat.includes("cream") ||
    cat.includes("lotion") ||
    cat.includes("shampoo") ||
    cat.includes("personal care")
  ) {
    return RETURN_REASONS.COSMETICS;
  }

  // 📚 Books
  if (
    cat.includes("book") ||
    cat.includes("stationery") ||
    cat.includes("stationary") ||
    cat.includes("pen") ||
    cat.includes("pencil") ||
    cat.includes("notebook") ||
    cat.includes("copy") ||
    cat.includes("novel") ||
    cat.includes("magazine")
  ) {
    return RETURN_REASONS.BOOKS;
  }

  // 🏠 Home / Kitchen
  if (
    cat.includes("home") ||
    cat.includes("kitchen") ||
    cat.includes("furniture") ||
    cat.includes("decor") ||
    cat.includes("cookware") ||
    cat.includes("utensil") ||
    cat.includes("bedding")
  ) {
    return RETURN_REASONS.HOME;
  }

  // ⚽ Sports
  if (
    cat.includes("sport") ||
    cat.includes("fitness") ||
    cat.includes("gym") ||
    cat.includes("exercise") ||
    cat.includes("cricket") ||
    cat.includes("football") ||
    cat.includes("yoga")
  ) {
    return RETURN_REASONS.SPORTS;
  }

  // 🧸 Toys / Baby
  if (
    cat.includes("toy") ||
    cat.includes("baby") ||
    cat.includes("kid") ||
    cat.includes("children") ||
    cat.includes("infant")
  ) {
    return RETURN_REASONS.TOYS;
  }

  return RETURN_REASONS.DEFAULT;
};