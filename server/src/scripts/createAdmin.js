import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User.js";

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ DB connected");

    const email = "asalimart6@gmail.com";
    const existing = await User.findOne({ email });

    if (existing) {
      console.log("⚠️ Admin already exists:", email);
      process.exit(0);
    }

    const admin = await User.create({
      name: "AsaliMart Admin",
      email : "asalimart6@gmail.com",
      phone: "8709869879",
      password: "bajarangbali360150155771",
      role: "ADMIN",
    });

    console.log("✅ Admin created!");
    console.log("   Email:", email);
    console.log("   Password: admin123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

createAdmin();