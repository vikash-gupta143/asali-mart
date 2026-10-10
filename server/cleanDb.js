import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Order from "./src/models/Order.js";
import Product from "./src/models/Product.js";
import User from "./src/models/User.js";
import Payout from "./src/models/Payout.js";
import Shop from "./src/models/Shop.js";
import Coupon from "./src/models/Coupon.js";
import Review from "./src/models/Review.js";
import DeliveryPartner from "./src/models/DeliveryPartner.js";
import Chat from "./src/models/Chat.js";
import Message from "./src/models/Message.js";

const cleanDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n🗑️  Deleting...");

    const orders = await Order.deleteMany({});
    console.log(`   Orders: ${orders.deletedCount} deleted`);

    const payouts = await Payout.deleteMany({});
    console.log(`   Payouts: ${payouts.deletedCount} deleted`);

    const products = await Product.deleteMany({});
    console.log(`   Products: ${products.deletedCount} deleted`);

    const shops = await Shop.deleteMany({});
    console.log(`   Shops: ${shops.deletedCount} deleted`);

    const coupons = await Coupon.deleteMany({});
    console.log(`   Coupons: ${coupons.deletedCount} deleted`);

    const reviews = await Review.deleteMany({});
    console.log(`   Reviews: ${reviews.deletedCount} deleted`);

    const partners = await DeliveryPartner.deleteMany({});
    console.log(`   Delivery Partners: ${partners.deletedCount} deleted`);

    const chats = await Chat.deleteMany({});
    console.log(`   Chats: ${chats.deletedCount} deleted`);

    const messages = await Message.deleteMany({});
    console.log(`   Messages: ${messages.deletedCount} deleted`);

    // Sirf Admin rakhna hai, baaki sab delete
    const users = await User.deleteMany({ role: { $ne: "ADMIN" } });
    console.log(`   Users (except Admin): ${users.deletedCount} deleted`);

    console.log("\n🎉 Database cleaned successfully!");
    console.log("\n📊 Remaining:");
    console.log("   Orders:", await Order.countDocuments());
    console.log("   Products:", await Product.countDocuments());
    console.log("   Users:", await User.countDocuments());

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

cleanDb();