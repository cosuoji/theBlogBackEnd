import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { addToCart, getCart, removeFromCart, updateCartItem } from "../controllers/cart.controller.js";


const cartRoutes = express.Router();

cartRoutes.get("/cart", protectRoute, getCart);
cartRoutes.post("/cart", protectRoute, addToCart)
cartRoutes.delete("/cart/:itemId", protectRoute, removeFromCart)
cartRoutes.put("/cart/:itemId", protectRoute, updateCartItem)



export default cartRoutes;