import express from "express";
import { deleteMagazine, getMagazineWithArticles } from "../controllers/magazine.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";


const magazineRoutes = express.Router();

magazineRoutes.get("/:issueNumber",getMagazineWithArticles);
magazineRoutes.delete("/:issueNumber",protectRoute, adminRoute, deleteMagazine);

export default magazineRoutes;