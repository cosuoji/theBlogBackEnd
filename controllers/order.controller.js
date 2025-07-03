import asyncHandler from 'express-async-handler';
import Cart from "../models/cart.model.js"
import Order from '../models/order.model.js';
import crypto from "crypto"
import axios from 'axios';

import dotenv from "dotenv"
import User from '../models/user.model.js';
import AdminLog from '../models/adminlog.model.js';
dotenv.config()

const STATUS_FLOW = [ "pending", "shipped", "delivered"];


export const createOrder = asyncHandler(async (req, res) => {
    const { 
      shippingAddress, 
      paymentMethod, 
      taxPrice, 
      shippingPrice 
    } = req.body;
  
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product');
  
    if (!cart || cart.items.length === 0) {
      res.status(400);
      throw new Error('No items in cart');
    }
  
    const items = cart.items.map(item => ({
      product: item.product._id,
      variant: item.variant,
      quantity: item.quantity,
      price: item.price
    }));
  
    const subtotal = cart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
  
    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      taxPrice,
      shippingPrice,
      total: subtotal + taxPrice + shippingPrice
    });
  
    const createdOrder = await order.save();
    
    // Clear cart
    await Cart.findByIdAndDelete(cart._id);
    
    res.status(201).json(createdOrder);
  });

  // @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email'); // ✅ Only populate the user

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user._id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized');
  }

  res.json(order); // ✅ product details are already embedded
});

  export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'name images');
  
    res.json(orders);
  });

 // controllers/orderController.js
  export const getOrders = asyncHandler(async (req, res) => {
    const { search = "", status = "", page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { 'user.email': { $regex: search, $options: "i" } } // If user is populated
      ];
    }

    const orders = await Order.find(query)
      .populate("user", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pages: Math.ceil(total / limit),
      currentPage: +page
    });
  });



  export const paystackPayment = asyncHandler(async (req, res) => {
    try {
      const { email, amount, products, formData} = req.body;   
      const formattedProducts = products.map((product) => ({
        product: product
      }));
  
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: email,
          amount: amount * 100, // Paystack amount is in kobo
          metadata: {
            products: formattedProducts,
            data: formData
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      const { authorization_url, reference } = response.data.data;
      res.json({ authorizationUrl: authorization_url, reference });      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  })

  
  export const paystackWebhook = asyncHandler(async (req, res) => {
    try {
      const rawBody = req.body; // This is a Buffer
      const signature = req.headers['x-paystack-signature'];
  
      // ✅ Step 1: Validate the signature
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(rawBody) // raw Buffer here
        .digest('hex');
  
      if (hash !== signature) {
        console.log('❌ Invalid Paystack signature');
        return res.status(400).send('Invalid signature');
      }
  
      // ✅ Step 2: Parse buffer into JSON
      const payload = JSON.parse(rawBody.toString('utf-8'));



     
      // ✅ Step 3: Process the event
      if (payload.event === 'charge.success') {
        const data = payload.data;
        const user = await User.findOne({ email: data.customer.email }).select('_id');
        

        const items = data.metadata.products.map((entry) => ({
          product: entry.product,
          quantity: parseInt(entry.product.quantity),
          price: parseFloat(entry.product.price)
        }));

       const newOrder = new Order({
          user: user._id,
          firstName: data.metadata.data.firstName,
          lastName: data.metadata.data.lastName,
          orderNumber: data.id,
          items,
          total: data.amount / 100,
          payment: {
            method: 'paystack',
            status: data.gateway_response,
            transactionId: data.id,
            amount: data.amount / 100,
            reference: data.reference, 
          },
          shippingAddress: {
            street: data.metadata.data.address,
            city: data.metadata.data.city,
            state: data.metadata.data.state,
            country: data.metadata.data.country,
            zipCode: data.metadata.data.zipCode
          },
          shipping: {
            method: data.metadata.shippingMethod,
            cost: data.metadata.shippingMethod === 'express' ? 15 : 5
          },
        });
  
        await newOrder.save()
        console.log('✅ Order saved successfully');
        return res.status(200).send('Success');
      } else {
        console.log('ℹ️ Unhandled event:', payload.event);
        return res.status(200).send('Event ignored');
      }
    } catch (err) {
      console.error('🚨 Error processing Paystack webhook:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  export const checkPaymentStatus = asyncHandler(async (req, res) => {
    const { reference } = req.params;
  
    const order = await Order.findOne({ 'payment.reference': reference });
  
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
  
    return res.json({ status: order.payment.status });
  });

  export const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
  
    if (!order) {
      return res.status(404).send('Order not found');
    }
  
    // Optional business rules
    if (order.status === 'shipped' || order.status === 'delivered') {
      
      return res.status(404).send('Can not cancel a shipped or delivered order');    }
  
    if (order.isCancelled) {
      order.isCancelled = false
     
    } else {
      // Cancel the order
      order.isCancelled = true;
      order.cancelledAt = Date.now();
    }
  
  
  
    const updatedOrder = await order.save();
  
    // Log the admin action
    await AdminLog.create({
      admin: req.user._id,
      action: 'pending',
      targetOrder: order._id
    });
  
    res.json({
      message: 'Order cancelled successfully',
      orderId: updatedOrder._id,
      status: updatedOrder.status
    });
  });
  
export const cycleOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  if (currentIndex === -1) {
    res.status(400);
    throw new Error("Invalid current status");
  }

  const nextStatus = STATUS_FLOW[(currentIndex + 1) % STATUS_FLOW.length];

  // Optional: Enforce rules for certain transitions
  if (nextStatus === "shipped" && order.payment?.status !== "paid" && order.payment?.status !== "Successful") {
    res.status(400);
    throw new Error("Order must be paid before shipping");
  }

  // Apply status-specific updates
  if (nextStatus === "shipped") {
    order.isShipped = true;
    order.shippedAt = Date.now();
  } else if (nextStatus === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  } else {
    // Reset if going back to earlier states
    order.isShipped = false;
    order.isDelivered = false;
  }

  order.status = nextStatus;
  const updatedOrder = await order.save();

  // ✅ Log admin action
  await AdminLog.create({
    admin: req.user._id,
    action: `${nextStatus}`,
    targetOrder: order._id
  });

  // Placeholder: Trigger emails/notifications
  console.log(`🔔 Email: Order ${order._id} is now ${nextStatus}`);

  res.json(updatedOrder);
});