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


// 6. Backend Considerations
// When sending prices to your backend (for orders/payments), always convert to your base currency (NGN):

// const { currency, exchangeRates } = useCurrency();

// const processOrder = async (cartItems) => {
//   // Convert all prices to NGN before sending to backend
//   const orderData = {
//     items: cartItems.map(item => ({
//       ...item,
//       price: item.price * exchangeRates[currency],
//       currency: 'NGN' // Always process in base currency
//     })),
//     original_currency: currency,
//     exchange_rate: exchangeRates[currency]
//   };

//   await api.post('/orders', orderData);
// };