import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import validator from "validator"; // install with: npm install validator
import asyncHandler from 'express-async-handler';
import Order from "../models/order.model.js";
import crypto from 'crypto';
import sendEmail from "../lib/sendEmail.js";
import { setCookies, storeRefreshToken, generateTokens } from "../utils/authHelpers.js";






export const signup = async (req, res) => {
    const { email, password} = req.body;
  
    try {
      // ✅ 1) Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // ✅ 2) Validate email format
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
  
      // ✅ 3) Validate password strength
      const isStrong = validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      });
  
      if (!isStrong) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.",
        });
      }
  
      // ✅ 4) Passed: create user
      const user = await User.create({ email, password });
  
      // ✅ 5) Auth tokens & cookies
      const { accessToken, refreshToken } = generateTokens(user._id);
      await storeRefreshToken(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);
  
      // ✅ 6) Respond with user data
      res.status(201).json({
        _id: user._id,
        email: user.email,
		profile: user.profile,
        role: user.role,
      });
  
    } catch (error) {
      console.log("Error in signup controller", error.message);
      res.status(500).json({ message: error.message });
    }
  };
export const login = async (req, res) => {
	try {
	  const { email, password } = req.body;
	  
	  // 1. Validate input
	  if (!email || !password) {
		return res.status(400).json({ message: "Email and password are required" });
	  }
  
	  // 2. Find user
	  const user = await User.findOne({ email }).select('+password').populate('cart wishlist');;
	  if (!user) {
		return res.status(401).json({ message: "Invalid credentials" });
	  }
  
	  // 3. Verify password
	  const isMatch = await user.comparePassword(password);
	  if (!isMatch) {
		return res.status(401).json({ message: "Invalid credentials" });
	  }
  
	  
	  // 4. Generate tokens
	  const { accessToken, refreshToken } = generateTokens(user._id);
	  
	  // 5. Store refresh token
	  await storeRefreshToken(user._id, refreshToken);
	  
	  // 6. Set cookies
	  setCookies(res, accessToken, refreshToken);
  
	  // 7. Return user data (without password)
	  res.json({
		_id: user._id,
		email: user.email,
		role: user.role,
		refreshToken
	  });
  
	} catch (error) {
	  console.error("Login error:", error);
	  res.status(500).json({ message: "Internal server error" });
	}
  };

export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		const accessToken = req.cookies.accessToken;

		if (refreshToken) {
			const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
			await redis.del(`refresh_token:${decoded.userId}`);
		}

        if (accessToken) {
			const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
			await redis.set(`bl_access:${decoded.jti}`, true, 'EX', 60 * 60); // 1 hour
		}

		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};


export const getFullProfile = asyncHandler(async (req, res) => {
try {
		const user = await User.findById(req.user._id)
		  .select('-password -refreshTokens')
		  .lean();
	  
		const orders = await Order.find({ user: req.user._id })
		  .sort('-createdAt')
		  .limit(10)
		  .lean();
	  
		res.json({
		  user,
		  addresses: user.addresses || [],
		  wishlist: user.wishlist || [],
		  orders: [orders] || [],
		});
} catch (error) {
	res.status(500).json({ message: "Server error", error: error.message });
}
  });
  
  export const forgotPassword = async (req, res) => {
	const { email } = req.body;
  
	// 1. Find user
	const user = await User.findOne({ email });
	if (!user) return res.status(400).json({ message: "No account with that email" });
  
	// 2. Generate reset token
	const resetToken = crypto.randomBytes(32).toString('hex');
	const resetTokenExpiry = Date.now() + 3600000; // 1 hour
  
	user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
	user.resetPasswordExpires = resetTokenExpiry;
	await user.save();
  
	// 3. Send email
	const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
	await sendEmail(user.email, "Password Reset", `Reset your password: ${resetUrl}`);
  
	res.json({ message: "Reset link sent to your email" });
  };

  // 2) User resets password
export const resetPassword = async (req, res) => {
	const { token } = req.params;
	const { password } = req.body;
  
	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
	const user = await User.findOne({
	  resetPasswordToken: hashedToken,
	  resetPasswordExpires: { $gt: Date.now() },
	});
  
	if (!user) return res.status(400).json({ message: "Token invalid or expired" });
  
	user.password = password;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	await user.save();
  
	res.json({ message: "Password has been reset successfully" });
  };

    export const refreshToken = asyncHandler(async (req, res) => {
    try {
      
    const oldRefreshToken =
      req.cookies.refreshToken ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!oldRefreshToken) throw new Error("No refresh token");
  
      // 1. Verify token
      const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);
  
      // 2. Check Redis store
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      if (storedToken !== oldRefreshToken) {
        throw new Error("Invalid refresh token");
      }
  
      // 3. Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
  
      // 4. Store new refresh token in Redis
      await redis.set(
        `refresh_token:${decoded.userId}`,
        newRefreshToken,
        "EX",
        30 * 24 * 60 * 60
      );
  
      // 5. Set new cookies
      setCookies(res, accessToken, newRefreshToken);
  
      // 6. Respond
      res.json({
        accessToken,
        refreshToken: newRefreshToken
      });
  
    } catch (error) {
      // Clear cookies to force logout on client
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      res.status(401).json({ message: error.message || "Unauthorized" });
    }
  });