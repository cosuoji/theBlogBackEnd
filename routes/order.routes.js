import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createOrder, getMyOrders, getOrderById, getOrders, updateOrderToDelivered, updateOrderToPaid, updateOrderToShipped } from "../controllers/order.controller.js";

const orderRoutes = express.Router();

orderRoutes.post("/", protectRoute, createOrder)
orderRoutes.get("/:id", protectRoute,adminRoute, getOrderById)
orderRoutes.get("/myorders", protectRoute, getMyOrders)
orderRoutes.get("/", protectRoute, adminRoute, getOrders)
orderRoutes.put("/:id/pay", protectRoute, updateOrderToPaid)
orderRoutes.put(":id/shipped", protectRoute, adminRoute, updateOrderToShipped)
orderRoutes.put(":id/deliver", protectRoute, adminRoute, updateOrderToDelivered)

export default orderRoutes;