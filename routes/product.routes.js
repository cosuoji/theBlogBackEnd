import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createProduct, deleteProduct, getProductBySlug, getProducts, updateProduct } from "../controllers/product.controller.js";
import { validateMagazine } from "../middleware/validateObjectId.js";


const productRoutes = express.Router();

productRoutes.post("/", protectRoute, adminRoute, validateMagazine, createProduct);
productRoutes.get("/", getProducts)
productRoutes.get("/:slug", getProductBySlug)
productRoutes.put("/:id", protectRoute, adminRoute, updateProduct)
productRoutes.delete("/:id", protectRoute, adminRoute, deleteProduct)

export default productRoutes;