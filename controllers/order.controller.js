import asyncHandler from 'express-async-handler';
import Cart from "../models/cart.model.js"
import Order from '../models/order.model.js';

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
      .populate('user', 'name email')
      .populate('items.product', 'name price images');
  
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
  
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      res.status(401);
      throw new Error('Not authorized');
    }
  
    res.json(order);
  });

  export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('items.product', 'name images');
  
    res.json(orders);
  });

  export const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort('-createdAt');
  
    res.json(orders);
  });
  
  export const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
  
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
  
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address
    };
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  });

  export const updateOrderToShipped = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email'); // Optional but useful for notifications
  
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
  
    // Validate order status transition
    if (!order.isPaid) {
      res.status(400);
      throw new Error('Order must be paid before shipping');
    }
  
    if (order.isShipped) {
      res.status(400);
      throw new Error('Order is already shipped');
    }
  
    // Update order status
    order.isShipped = true;
    order.shippedAt = Date.now();
    order.status = 'shipped'; // If you're using a status enum
    
    const updatedOrder = await order.save();
  
    // Here you would typically:
    // 1. Send shipping confirmation email
    // 2. Update inventory (if not done at payment)
    // 3. Trigger any post-shipping workflows
  
    res.json({
      _id: updatedOrder._id,
      isShipped: updatedOrder.isShipped,
      shippedAt: updatedOrder.shippedAt,
    });
  });
  export const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
  
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
  
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    order.status = 'delivered'; // If you're using a status enum

  
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  });