import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createCoupon, deleteCoupon, getCoupons, validateCoupon } from "../controllers/coupon.controller.js";


const couponRoutes = express.Router();

couponRoutes.post("/", protectRoute, adminRoute, createCoupon)
couponRoutes.post("/", protectRoute, validateCoupon)
couponRoutes.get("/", protectRoute, adminRoute, getCoupons)
couponRoutes.delete("/", protectRoute, adminRoute, deleteCoupon)
export default couponRoutes;