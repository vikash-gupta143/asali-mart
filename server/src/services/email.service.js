import nodemailer from "nodemailer";

// 📧 Create transporter
const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT) || 587;
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: port,
    secure: port === 465,  // ← 465 ke liye true, 587 ke liye false
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // 🆕 IPv4 force karo (Render IPv6 issue ke liye)
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    // DNS resolution
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// ============================================
// 📧 1. Send OTP Email (SHIPPED pe jaayega)
// ============================================
export const sendOTPEmail = async (
  to,
  otp,
  orderNumber,
  customerName = "Customer"
) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email credentials missing — email not sent");
      return { success: false, message: "Email service not configured" };
    }

    const transporter = createTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', Arial, sans-serif; background: #f8f9fb; margin: 0; padding: 0; }
          .container { max-width: 500px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #FF6B00, #FF8A33); padding: 30px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; }
          .header p { margin: 5px 0 0; opacity: 0.9; font-size: 13px; }
          .body { padding: 30px; }
          .greeting { font-size: 15px; color: #111827; margin-bottom: 15px; }
          .info { color: #6B7280; font-size: 14px; line-height: 1.6; margin-bottom: 25px; }
          .otp-box { background: #FFF3E0; border: 2px dashed #FF6B00; border-radius: 12px; padding: 25px; text-align: center; margin: 25px 0; }
          .otp-label { font-size: 12px; color: #E55F00; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
          .otp-code { font-size: 42px; font-weight: 800; color: #FF6B00; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace; }
          .order-num { font-size: 13px; color: #6B7280; margin-top: 8px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 15px; border-radius: 8px; font-size: 13px; color: #92400E; margin: 20px 0; }
          .footer { background: #F8F9FB; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; }
          .footer a { color: #FF6B00; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 AsaliMart</h1>
            <p>Your Local Marketplace</p>
          </div>
          <div class="body">
            <p class="greeting">Hi <b>${customerName}</b>,</p>
            <p class="info">
              Aapka order <b>#${orderNumber}</b> out for delivery hai! 🚚<br>
              Delivery partner aapke ghar aa raha hai. Niche diya gaya OTP delivery partner ko batayein.
            </p>

            <div class="otp-box">
              <div class="otp-label">🔐 Delivery OTP</div>
              <div class="otp-code">${otp}</div>
              <div class="order-num">Order #${orderNumber}</div>
            </div>

            <div class="warning">
              ⚠️ <b>Important:</b> Ye OTP <b>sirf delivery person</b> ko batayein. Kisi aur ke saath share na karein.
            </div>

            <p class="info" style="margin-top: 25px;">
              Delivery ke waqt OTP verify hone ke baad hi order <b>DELIVERED</b> mark hoga.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 AsaliMart. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:support@asalimart.com">support@asalimart.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "AsaliMart <noreply@asalimart.com>",
      to,
      subject: `🔐 Your AsaliMart Order #${orderNumber} OTP is ${otp}`,
      html: htmlContent,
      text: `Your AsaliMart order #${orderNumber} OTP is ${otp}. Share only with delivery person.`,
    });

    console.log(`✅ OTP email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ OTP Email Error:", error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// 📧 2. Send Order Confirmation Email
// ============================================
export const sendOrderConfirmationEmail = async (
  to,
  order,
  customerName = "Customer"
) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { success: false, message: "Email service not configured" };
    }

    const transporter = createTransporter();

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; width: 60px;">
            <img src="${item.image}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" />
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px;">
            <b>${item.name}</b><br>
            <span style="color: #6B7280;">Qty: ${item.qty} × ₹${item.finalPrice}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
            ₹${item.finalPrice * item.qty}
          </td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #FF6B00, #FF8A33); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0;">🛒 AsaliMart</h1>
          <p style="margin: 5px 0 0; opacity: 0.9;">Order Confirmed!</p>
        </div>
        <div style="padding: 30px;">
          <p>Hi <b>${customerName}</b>,</p>
          <p style="color: #6B7280;">Aapka order confirm ho gaya hai. Jaldi deliver karenge! 🚚</p>

          <div style="background: #F0FDF4; border-radius: 12px; padding: 15px; margin: 20px 0; text-align: center;">
            <div style="font-size: 12px; color: #166534; text-transform: uppercase;">Order Number</div>
            <div style="font-size: 24px; font-weight: 800; color: #15803D;">#${order.orderNumber}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            ${itemsHtml}
          </table>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 5px 0; color: #6B7280;">Subtotal</td>
                <td style="text-align: right;">₹${order.itemsPrice}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6B7280;">Delivery</td>
                <td style="text-align: right;">${order.deliveryCharge === 0 ? "FREE" : "₹" + order.deliveryCharge}</td>
              </tr>
              <tr style="font-size: 18px; font-weight: 800;">
                <td style="padding: 10px 0;">Total</td>
                <td style="text-align: right; color: #FF6B00;">₹${order.totalAmount}</td>
              </tr>
            </table>
          </div>

          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; border-radius: 8px; font-size: 13px; color: #92400E; margin-top: 20px;">
            📦 Delivery method: <b>${order.deliveryType === "SELLER" ? "Seller Delivery" : "AsaliMart Delivery"}</b>
          </div>
        </div>
        <div style="background: #F8F9FB; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF;">
          <p>© 2026 AsaliMart. All rights reserved.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "AsaliMart <noreply@asalimart.com>",
      to,
      subject: `✅ Order Confirmed - #${order.orderNumber}`,
      html: htmlContent,
    });

    console.log(`✅ Confirmation email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Confirmation Email Error:", error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// 📧 3. Send Order Delivered Email
// ============================================
export const sendOrderDeliveredEmail = async (
  to,
  order,
  customerName = "Customer"
) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { success: false, message: "Email service not configured" };
    }

    const transporter = createTransporter();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 30px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #00C853, #00A844); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 40px;">✅</h1>
          <h2 style="margin: 10px 0 0;">Delivered!</h2>
        </div>
        <div style="padding: 30px; text-align: center;">
          <p style="font-size: 15px;">Hi <b>${customerName}</b>,</p>
          <p style="color: #6B7280; line-height: 1.6;">
            Aapka order <b>#${order.orderNumber}</b> successfully deliver ho gaya! 🎉
          </p>

          <div style="background: #F0FDF4; border-radius: 12px; padding: 15px; margin: 20px 0;">
            <div style="font-size: 12px; color: #166534; text-transform: uppercase;">Total Paid</div>
            <div style="font-size: 28px; font-weight: 800; color: #15803D;">₹${order.totalAmount}</div>
          </div>

          <p style="color: #6B7280; font-size: 14px;">
            Kaisa laga AsaliMart ka experience? Apna feedback share karein!
          </p>

          <a href="http://localhost:5173/orders/${order._id}" 
             style="display: inline-block; background: #FF6B00; color: white; padding: 12px 30px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 15px;">
            ⭐ Rate Your Order
          </a>
        </div>
        <div style="background: #F8F9FB; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF;">
          <p>© 2026 AsaliMart. All rights reserved.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "AsaliMart <noreply@asalimart.com>",
      to,
      subject: `✅ Order Delivered - #${order.orderNumber}`,
      html: htmlContent,
    });

    console.log(`✅ Delivered email sent to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Delivered Email Error:", error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// 📧 4. Test Email Function
// ============================================
export const sendTestEmail = async (to) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: "✅ AsaliMart Email Test",
      html: "<h1>Email chal raha hai! 🎉</h1><p>AsaliMart email service working properly.</p>",
    });
    console.log(`✅ Test email sent to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Test Email Error:", error.message);
    return { success: false, message: error.message };
  }
};

// ============================================================
// 🔐 PASSWORD RESET EMAIL
// ============================================================
export const sendPasswordResetEmail = async (email, resetToken, name) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email credentials missing — email not sent");
      return { success: false, message: "Email service not configured" };
    }

    // ✅ Transporter create karo (yeh line missing thi)
    const transporter = createTransporter();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "AsaliMart <noreply@asalimart.com>",
      to: email,
      subject: "🔐 Password Reset - AsaliMart",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; margin: 0; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #FF6B00, #FF8C33); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .content h2 { color: #333; margin-top: 0; }
            .content p { color: #666; line-height: 1.6; }
            .button { display: inline-block; padding: 15px 30px; background: #FF6B00; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
            .warning p { margin: 0; color: #856404; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hello ${name || "User"} 👋</h2>
              <p>Aapne AsaliMart account ka password reset karne ki request ki hai.</p>
              <p>Naya password set karne ke liye niche button click karein:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">🔐 Reset Password</a>
              </div>

              <div class="warning">
                <p>⚠️ <b>Important:</b> Yeh link sirf <b>15 minute</b> ke liye valid hai.</p>
              </div>

              <p>Agar aapne yeh request nahi ki hai, toh is email ko ignore karein. Aapka password safe hai.</p>
              
              <p style="margin-top: 30px; font-size: 12px; color: #999;">
                Agar button kaam nahi kar raha, toh yeh URL copy-paste karein:<br>
                <a href="${resetUrl}" style="color: #FF6B00; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AsaliMart - Local Marketplace</p>
              <p>Yeh ek automated email hai, kripya reply na karein.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `AsaliMart password reset link: ${resetUrl} (15 minute ke liye valid)`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Password reset email failed:", error.message);
    return { success: false, message: error.message };
  }
};