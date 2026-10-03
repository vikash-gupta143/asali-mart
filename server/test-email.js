import dotenv from "dotenv";
dotenv.config();
import { sendTestEmail } from "./src/services/email.service.js";

const test = async () => {
  const result = await sendTestEmail("your_email@gmail.com");  // ← Apna email daalo
  console.log("Result:", result);
  process.exit(0);
};

test();