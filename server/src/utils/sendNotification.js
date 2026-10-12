// 🔔 Firebase Admin — getMessaging import karo (admin.messaging nahi)
import { getMessaging } from "firebase-admin/messaging";
import User from "../models/User.js";

/**
 * Send Push Notification to a single user
 */
export const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    // 1. User ko dhundho
    const user = await User.findById(userId).select("fcmToken");
    if (!user || !user.fcmToken) {
      console.log(`⚠️ No FCM token found for user ${userId}`);
      return { success: false, message: "No FCM token" };
    }

    // 2. Message banao
    const message = {
      token: user.fcmToken,
      notification: { title, body },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      webpush: {
        notification: {
          title,
          body,
          icon: "/favicon.svg",
          badge: "/favicon.svg",
        },
        fcmOptions: {
          link: data.link || "/",
        },
      },
    };

    // 3. Notification bhejo — getMessaging() use karo
    const response = await getMessaging().send(message);
    console.log(`✅ Notification sent to ${userId}:`, response);
    return { success: true, response };
  } catch (error) {
    console.error(`❌ Notification failed for ${userId}:`, error.message);

    // Invalid token ho toh remove kar do
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      await User.findByIdAndUpdate(userId, { fcmToken: "" });
      console.log(`🗑️ Removed invalid FCM token for user ${userId}`);
    }

    return { success: false, message: error.message };
  }
};

/**
 * Send Push Notification to multiple users (bulk)
 */
export const sendNotificationToMultiple = async (
  userIds,
  title,
  body,
  data = {}
) => {
  try {
    const users = await User.find({
      _id: { $in: userIds },
      fcmToken: { $ne: "" },
    }).select("fcmToken");

    if (users.length === 0) {
      console.log("⚠️ No users with FCM tokens found");
      return { success: false, message: "No valid tokens" };
    }

    const tokens = users.map((u) => u.fcmToken);

    const message = {
      tokens,
      notification: { title, body },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      webpush: {
        notification: {
          title,
          body,
          icon: "/favicon.svg",
          badge: "/favicon.svg",
        },
        fcmOptions: {
          link: data.link || "/",
        },
      },
    };

    const response = await getMessaging().sendEachForMulticast(message);
    console.log(
      `✅ Bulk notification sent: ${response.successCount} success, ${response.failureCount} failed`
    );
    return { success: true, response };
  } catch (error) {
    console.error("❌ Bulk notification failed:", error.message);
    return { success: false, message: error.message };
  }
};