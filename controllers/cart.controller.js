import asyncHandler from 'express-async-handler';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name price images');
  
    if (!cart) {
      return res.json({ items: [], subtotal: 0, total: 0 });
    }
  
    res.json(cart);
  });

// controllers/productController.js
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variant, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Handle variant validation only for regular products
  if (product.productType === 'regular' && variant) {
    const variantObj = product.variants.find(
      v => v.name === variant.name && 
      v.options.some(opt => opt.name === variant.option)
    );
    
    if (!variantObj) {
      res.status(400);
      throw new Error('Invalid variant');
    }
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(item => 
    item.product.equals(productId) && 
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ 
      product: productId, 
      variant, 
      quantity, 
      price: product.price,
      productType: product.productType // Include product type in cart
    });
  }

  await cart.save();
  res.status(201).json(cart);
});



  export const removeFromCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
  
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }
  
    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.itemId
    );
  
    await cart.save();
    res.json(cart);
  });
  
  // @desc    Update cart item quantity
  // @route   PUT /api/cart/:itemId
  // @access  Private
  export const updateCartItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
  
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }
  
    const item = cart.items.find(
      item => item._id.toString() === req.params.itemId
    );
  
    if (!item) {
      res.status(404);
      throw new Error('Item not found in cart');
    }
  
    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  });