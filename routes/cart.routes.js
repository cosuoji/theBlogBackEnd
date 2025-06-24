import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { addToCart, addToCartShoes, clearCart, getCart, removeFromCart, updateCartItem } from "../controllers/cart.controller.js";


const cartRoutes = express.Router();

cartRoutes.get("/", protectRoute, getCart);
cartRoutes.post("/", protectRoute, addToCart)
cartRoutes.post("/shoes", protectRoute, addToCartShoes)
cartRoutes.delete("/:itemId", protectRoute, removeFromCart)
cartRoutes.put("/:itemId", protectRoute, updateCartItem)
cartRoutes.delete("/clear", protectRoute, clearCart)



export default cartRoutes;