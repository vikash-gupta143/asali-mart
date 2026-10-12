import twilio from "twilio";
import { config } from "../config/env.js";

// 🔧 Twilio Client Initialize
const client = twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

const FROM_WHATSAPP = config.twilio.whatsappNumber; // "whatsapp:+17372508034"

// 🎯 AsaliMart Content Templates (Twilio Console → Content Template Builder)
const TEMPLATES = {
  ORDER_CONFIRMATION: "HX72d67b1c3110cdfbcfe079952abf6a01", // 🆕 Aapka banaya hua template
  DELIVERY_UPDATE: "",   // 🔜 Baad me banayenge
  OTP_VERIFICATION: "",  // 🔜 Baad me banayenge
};

/**
 * 📤 Send WhatsApp using Template (Production-Ready)
 */
export const sendWhatsAppTemplate = async (to, contentSid, variables = {}) => {
  try {
    if (!to) {
      console.log("⚠️ WhatsApp: No recipient number provided");
      return { success: false, message: "No recipient" };
    }

    if (!contentSid) {
      console.log("⚠️ WhatsApp: No ContentSid provided");
      return { success: false, message: "No ContentSid" };
    }

    // Ensure "+" prefix and no spaces
    let formattedTo = to.toString().replace(/\s+/g, "").trim();
    if (!formattedTo.startsWith("+")) {
      formattedTo = `+${formattedTo}`;
    }

    const toWhatsApp = `whatsapp:${formattedTo}`;

    const response = await client.messages.create({
      from: FROM_WHATSAPP,
      to: toWhatsApp,
      contentSid: contentSid,
      contentVariables: JSON.stringify(variables),
    });

    console.log(`✅ WhatsApp sent to ${formattedTo}: ${response.sid}`);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error(`❌ WhatsApp failed for ${to}:`, error.message);
    return { success: false, message: error.message };
  }
};

// ============================================================
// 📋 READY-MADE TEMPLATE FUNCTIONS (AsaliMart)
// ============================================================

/**
 * 🛒 Order Confirmation WhatsApp
 */
export const sendOrderConfirmationWhatsApp = async (phone, order, customerName) => {
  return sendWhatsAppTemplate(
    phone,
    TEMPLATES.ORDER_CONFIRMATION,
    {
      "1": order.orderNumber || "ORD-00000",  // {{1}} = Order Number
      "2": order.totalAmount?.toString() || "0", // {{2}} = Total Amount
    }
  );
};