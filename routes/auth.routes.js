import express from "express";
import { login, logout, signup, refreshToken, getFullProfile, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import ImageKit from 'imagekit';
import AdminLog from "../models/adminlog.model.js";


const authRoutes = express.Router();

export const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });
  
authRoutes.get('/imagekit', (req, res) => {
    try {
        // Force JSON content type
        res.setHeader('Content-Type', 'application/json');
        
        const authParams = imagekit.getAuthenticationParameters();
        
        // Stringify the response manually
        res.status(200).send(JSON.stringify({
          token: authParams.token,
          expire: authParams.expire,
          signature: authParams.signature
        }));
      } catch (error) {
        console.error('ImageKit auth error:', error);
        res.status(500).send(JSON.stringify({
          error: 'Authentication failed',
          details: error.message
        }));
      }
    });
authRoutes.get("/profile", protectRoute, getFullProfile)
authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.post("/refresh-token", refreshToken);
authRoutes.post("/forgot-password", forgotPassword)
authRoutes.post("/reset-password/:token", resetPassword)
authRoutes.get('/adminlogs', protectRoute, adminRoute, async (req, res) => {
  const logs = await AdminLog.find()
    .populate('admin', 'name email')
    .populate('targetOrder', 'orderNumber status createdAt')
    .sort({ createdAt: -1 });

  res.json(logs);
});


export default authRoutes;