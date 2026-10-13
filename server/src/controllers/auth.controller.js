import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { sendPasswordResetEmail } from "../services/email.service.js";

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Role check — ADMIN aur DELIVERY_PARTNER public register nahi kar sakte
    const allowedRoles = ["CUSTOMER", "SELLER"];
    const userRole = allowedRoles.includes(role) ? role : "CUSTOMER";

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: userRole,
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// 🔔 @desc    Save FCM Token for Push Notifications
// @route   POST /api/auth/save-fcm-token
// @access  Private
export const saveFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM Token is required",
      });
    }

    // User ko dhundh kar token update karein
    await User.findByIdAndUpdate(req.user.id, { fcmToken });

    res.status(200).json({
      success: true,
      message: "FCM Token saved successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 🔐 FORGOT PASSWORD — Send Reset Link
// @route   POST /api/auth/forgot-password
// @access  Public
// ============================================================
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email zaroori hai",
      });
    }

    // User dhundo
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // 🔒 Security: Same message for existing/non-existing user
      return res.status(200).json({
        success: true,
        message:
          "Agar yeh email registered hai, toh reset link bhej diya jayega. Apna inbox check karein.",
      });
    }

    // Reset token generate karo
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Email bhejo
    const emailResult = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name
    );

    if (!emailResult.success) {
      // Token clear karo agar email fail hui
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Email bhejne me problem aayi. Dobara try karein.",
      });
    }

    console.log(`✅ Password reset email sent to ${user.email}`);

    res.status(200).json({
      success: true,
      message:
        "Reset link aapke email pe bhej diya gaya hai. 15 minute ke andar use karein.",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// 🔐 RESET PASSWORD — Set New Password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
// ============================================================
export const resetPassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;

    // Validation
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password aur confirm password zaroori hai",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password aur confirm password match nahi kar rahe",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password kam se kam 6 characters ka hona chahiye",
      });
    }

    // Token hash karo
    const crypto = await import("crypto");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // User dhundo — valid token aur expiry check
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Reset link invalid ya expire ho gaya. Dobara 'Forgot Password' request karein.",
      });
    }

    // Naya password set karo
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    // Token generate karo — auto login ke liye
    const token = generateToken(user._id, user.role);

    console.log(`✅ Password reset successful for ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Password successfully reset ho gaya! 🎉",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};