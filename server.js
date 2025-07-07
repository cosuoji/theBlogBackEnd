import express from "express"
import dotenv from "dotenv"
import path from "path";
import cookieParser from "cookie-parser";
import postRoutes from "./routes/post.routes.js";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors"
import cartRoutes from "./routes/cart.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.routes.js";
import userRoutes from "./routes/user.route.js";
import magazineRoutes from "./routes/magazine.routes.js";
import shoeRoutes from "./routes/shoe.routes.js";
import { paystackWebhook } from "./controllers/order.controller.js";
import bodyParser from 'body-parser';



const app = express()
dotenv.config();


const __dirname = path.resolve();
const PORT = process.env.PORT || 5000;

app.post("/api/orders/webhook",bodyParser.raw({ type: '*/*' }), paystackWebhook)

app.use(express.json({ limit: "10mb" })); // allows you to parse the body of the request
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // For form data
// Enable CORS for all routes

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", 
	  "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });  

  app.use(cors({
    //origin: 'http://localhost:5173', // Your frontend URL
	origin: "https://thecompanytesting.netlify.app/",
    credentials: true // If using cookies/sessions
  }));


app.use("/api/blogs", postRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/products", productRoutes)
app.use("/api/user", userRoutes)
app.use("/api/shoes", shoeRoutes)
app.use("/api/magazines", magazineRoutes)



app.listen(PORT, () => {
	console.log("Server is running on http://localhost:" + PORT);
	connectDB();
});