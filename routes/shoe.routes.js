import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createCategory, createCollection, createColor, createLasts, createMaterials, createNewShoe, createSole, deleteShoe, getCategory, getCollection, getColors, getLasts, getMaterials, getShoes, getSingleShoe, getSoles, updateShoe } from "../controllers/shoe.controllers.js";


const shoeRoutes = express.Router();

//Shoe Variant Methods
shoeRoutes.post("/colors", protectRoute, adminRoute, createColor)
shoeRoutes.post("/soles", protectRoute, adminRoute, createSole)
shoeRoutes.post("/materials", protectRoute, adminRoute, createMaterials)
shoeRoutes.post("/lasts", protectRoute, adminRoute, createLasts)
shoeRoutes.post("/collections", protectRoute, adminRoute, createCollection)

//Get Shoe Variant Methods
shoeRoutes.get('/categories', getCategory),
shoeRoutes.get('/collections', getCollection),
shoeRoutes.get('/colors', getColors)
shoeRoutes.get('/soles', getSoles),
shoeRoutes.get('/lasts',getLasts),
shoeRoutes.get('/materials', getMaterials)


//Category Routes
shoeRoutes.post("/categories",protectRoute, adminRoute, createCategory)

//Shoe Methods
shoeRoutes.post("/", protectRoute, adminRoute, createNewShoe);
shoeRoutes.get("/", getShoes)
shoeRoutes.get("/:productId", getSingleShoe)
shoeRoutes.put("/:productId", protectRoute, adminRoute, updateShoe)
shoeRoutes.delete("/:productId", protectRoute, adminRoute, deleteShoe)




export default shoeRoutes;