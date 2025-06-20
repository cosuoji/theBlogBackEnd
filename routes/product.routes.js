import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createProduct, deleteProduct, getFeaturedMagazines, getMagazines, getProductBySlug, getProducts, updateProduct } from "../controllers/product.controller.js";


const productRoutes = express.Router();

productRoutes.post("/", protectRoute, adminRoute, createProduct);
productRoutes.get("/", getProducts)
productRoutes.get("/:slug", getProductBySlug)
productRoutes.put("/:id", protectRoute, adminRoute, updateProduct)
productRoutes.delete("/:id", protectRoute, adminRoute, deleteProduct)
productRoutes.get("/magazines", getMagazines)
productRoutes.get("/magazines/featured", getFeaturedMagazines)

export default productRoutes;