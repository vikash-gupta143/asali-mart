import dotenv from "dotenv";
dotenv.config();

// Debug
console.log("🔍 ENV Check:");
console.log("   PORT:", process.env.PORT);
console.log("   MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Missing");
console.log("   JWT_SECRET:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ Missing");

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});