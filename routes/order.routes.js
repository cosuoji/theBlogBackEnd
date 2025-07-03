import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { cancelOrder, checkPaymentStatus, createOrder, cycleOrderStatus, getMyOrders, getOrderById, getOrders, paystackPayment} from "../controllers/order.controller.js";

const orderRoutes = express.Router();

orderRoutes.post("/", protectRoute, createOrder)
orderRoutes.get("/myorders", protectRoute, getMyOrders)
orderRoutes.get("/", protectRoute, adminRoute, getOrders)
orderRoutes.post("/payment", protectRoute, paystackPayment)
orderRoutes.get("/payment/:reference", protectRoute, checkPaymentStatus)
orderRoutes.put("/:id/status-cycle", protectRoute, adminRoute, cycleOrderStatus);
orderRoutes.put('/:id/cancel', protectRoute, adminRoute, cancelOrder);
orderRoutes.get("/:id", protectRoute, getOrderById)




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