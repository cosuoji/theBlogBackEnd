import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAddresses,
    updateProfile
  } from '../controllers/user.controller.js';

const userRoutes = express.Router();

userRoutes.get("/address", protectRoute, getAddresses)
userRoutes.put("/profile", protectRoute, updateProfile)
userRoutes.post("/address", protectRoute, addAddress)
userRoutes.put("/address/:id", protectRoute, updateAddress)
userRoutes.delete("/address/:id", protectRoute, deleteAddress)
userRoutes.put("/address/:id/set-default", setDefaultAddress)


export default userRoutes;