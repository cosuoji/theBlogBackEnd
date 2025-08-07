import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
	try {
	      const accessToken = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');

  
	  if (!accessToken) {
		return res.status(401).json({ message: "Unauthorized - No access token provided" });
	  }
  
	  let decoded;
	  try {
		decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
	  } catch (error) {
		if (error.name === "TokenExpiredError") {
		  // Let frontend handle refresh
		  return res.status(401).json({ message: "Access token expired" });
		}
		return res.status(401).json({ message: "Invalid access token" });
	  }
  
	  const user = await User.findById(decoded.userId).select("-password");
	  if (!user) {
		return res.status(401).json({ message: "User not found" });
	  }
  
	  req.user = user;
	  next();
	} catch (error) {
	  console.error("Error in protectRoute middleware", error.message);
	  return res.status(401).json({ message: "Unauthorized" });
	}
  };
  

export const adminRoute = (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		return res.status(403).json({ message: "Access denied - Admin only" });
	}
};