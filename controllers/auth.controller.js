import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import validator from "validator"; // install with: npm install validator
import asyncHandler from 'express-async-handler';
import Order from "../models/order.model.js";
import crypto from 'crypto';
import sendEmail from "../lib/sendEmail.js";




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
	  });
  
	} catch (error) {
	  console.error("Login error:", error);
	  res.status(500).json({ message: "Internal server error" });
	}
  };

export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (refreshToken) {
			const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
			await redis.del(`refresh_token:${decoded.userId}`);
		}

		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Enhanced refreshToken endpoint
export const refreshToken = async (req, res) => {
	try {
	  const refreshToken = req.cookies.refreshToken;
	  if (!refreshToken) throw new Error("No refresh token");
  
	  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
	  const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
  
	  if (storedToken !== refreshToken) {
		throw new Error("Invalid refresh token");
	  }
  
	  // Generate new tokens
	  const { accessToken, newRefreshToken } = generateTokens(decoded.userId);
	  
	  // Update Redis storage (with new TTL)
	  await redis.set(
		`refresh_token:${decoded.userId}`,
		newRefreshToken,
		"EX", 
		30 * 24 * 60 * 60 // 30 days
	  );
  
	  // Set new cookies
	  setCookies(res, accessToken, newRefreshToken);
  
	  res.json({ 
		accessToken, 
		refreshToken: newRefreshToken 
	  });
	} catch (error) {
	  // Clear invalid tokens
	  res.clearCookie("accessToken");
	  res.clearCookie("refreshToken");
	  res.status(401).json({ message: error.message });
	}
  };

// Update token expiration times
const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
	  expiresIn: "1h", // Increased from 15m
	});
  
	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
	  expiresIn: "30d", // Increased from 7d
	});
  
	return { accessToken, refreshToken };
  };

const storeRefreshToken = async (userId, refreshToken) => {
	await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60); // 7days
};

// Update cookie settings
const setCookies = (res, accessToken, refreshToken) => {
	const cookieOptions = {
	  httpOnly: true,
	  secure: true,           // ✅ Force HTTPS for Netlify
	  sameSite: 'None',       // ✅ Required for cross-origin cookies
	  path: '/',
	};
  
	res.cookie('accessToken', accessToken, {
	  ...cookieOptions,
	  maxAge: 60 * 60 * 1000, // 1 hour
	});
  
	res.cookie('refreshToken', refreshToken, {
	  ...cookieOptions,
	  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
	});
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