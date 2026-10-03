import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

// 🛡️ Helmet — secure headers
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// 🚦 General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔐 Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 📦 OTP rate limiter
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many OTP requests. Try again later.",
  },
});

// 🧹 Custom sanitization (Express 5 compatible)
export const sanitizeData = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body) {
      const sanitize = (obj) => {
        if (!obj || typeof obj !== "object") return obj;
        Object.keys(obj).forEach((key) => {
          if (key.startsWith("$") || key.includes(".")) {
            delete obj[key];
          } else if (typeof obj[key] === "object") {
            sanitize(obj[key]);
          }
        });
        return obj;
      };
      sanitize(req.body);
    }
    next();
  } catch (err) {
    next();
  }
};

// 🛡️ XSS protection

// 🚫 HPP
export const preventParamPollution = hpp();