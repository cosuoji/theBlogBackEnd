import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { addToCart, addToCartShoes, clearCart, getCart, removeFromCart, updateCartItem } from "../controllers/cart.controller.js";



const cartRoutes = express.Router();

cartRoutes.get("/", protectRoute, getCart);
cartRoutes.post("/", protectRoute, addToCart)
cartRoutes.post("/shoes", protectRoute, addToCartShoes)
cartRoutes.delete("/clear", protectRoute, clearCart)
cartRoutes.delete("/:itemId", protectRoute, removeFromCart)
cartRoutes.put("/:itemId", protectRoute, updateCartItem)





export default cartRoutes;