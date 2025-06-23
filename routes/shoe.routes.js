import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createCategory, createCollection, createColor, createLasts, createMaterials, createNewShoe, createSole, deleteShoe, getCategory, getCollection, getColors, getLasts, getMaterials, getShoes, getSingleShoe, getSoles, updateShoe } from "../controllers/shoe.controllers.js";


const shoeRoutes = express.Router();

//Shoe Methods
shoeRoutes.post("/", protectRoute, adminRoute, createNewShoe);
shoeRoutes.get("/", getShoes)
shoeRoutes.get("/:id", getSingleShoe)
shoeRoutes.put("/:id", protectRoute, adminRoute, updateShoe)
shoeRoutes.delete("/:id", protectRoute, adminRoute, deleteShoe)

//Get Shoe Variant Methods
shoeRoutes.get('/categories', getCategory),
shoeRoutes.get('/collections', getCollection),
shoeRoutes.get('/colors', getColors)
shoeRoutes.get('/soles', getSoles),
shoeRoutes.get('/lasts',getLasts),
shoeRoutes.get('/materials', getMaterials)

//Shoe Variant Methods
shoeRoutes.post("/colors", protectRoute, adminRoute, createColor)
shoeRoutes.post("/soles", protectRoute, adminRoute, createSole)
shoeRoutes.post("/materials", protectRoute, adminRoute, createMaterials)
shoeRoutes.post("/lasts", protectRoute, adminRoute, createLasts)
shoeRoutes.post("/collections", protectRoute, adminRoute, createCollection)


//Category Routes
shoeRoutes.post("/categories",protectRoute, adminRoute, createCategory)

export default shoeRoutes;