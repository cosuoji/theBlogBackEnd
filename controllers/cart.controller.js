import asyncHandler from 'express-async-handler';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import Shoe from '../models/shoe.model.js';

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
// In your getCart controller
export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: 'items.product',
      select: 'name price images productType magazineData',
      transform: (doc) => {
        if (!doc) return null;
        return {
          _id: doc._id,
          name: doc.name,
          price: doc.price,
          images: doc.images,
          productType: doc.productType,
          ...(doc.productType === 'magazine' && {
            magazineData: {
              issueNumber: doc.magazineData?.issueNumber,
              coverImage: doc.magazineData?.coverImage.url
            }
          })
        };
      }
    });

  res.json(cart || { items: [], subtotal: 0, total: 0 });
});


// controllers/productController.js
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variant = null, quantity = 1, currency } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Validate variants if needed
  if (product.productType === 'regular' && variant) {
    const isValid = product.variants?.some(v =>
      v.name === variant.name &&
      v.options?.some(opt => opt.name === variant.option)
    );

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid variant selected.' });
    }
  }

  // For matching: shallow or deep comparison based on product type
  const isSameVariant = (a, b) => {
    if (!a && !b) return true;
    return JSON.stringify(a) === JSON.stringify(b);
  };

  const existingItemIndex = cart.items.findIndex(item =>
    item.product.equals(productId) &&
    isSameVariant(item.variant, variant)
  );

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    cart.items.push({
      product: product._id,
      variant,
      quantity,
      price: product.price,
      productType: product.productType || 'default',
      productModel: "Product",
    });
  }

  await cart.save();

  const populatedCart = await Cart.populate(cart, {
    path: 'items.product',
    select: 'name price images productType magazineData'
  });

  res.status(201).json(populatedCart);
});


export const addToCartShoes = asyncHandler(async(req, res) => {
  const { productId, variant, quantity = 1, currency } = req.body;
  // 1. Validate shoe exists
  const shoe = await Shoe.findById(productId);
  if (!shoe) {
    return res.status(404).json({ message: 'Shoe not found' });
  }

  // 2. Validate color and size
  const colorValid = shoe.colorOptions.some(c => c._id.equals(variant.color._id));
  const sizeValid = shoe.sizeOptions.includes(variant.size);
  
  if (!colorValid || !sizeValid) {
    return res.status(400).json({ 
      message: 'Invalid color or size selection' 
    });
  }

  // 3. Find or create cart
  let cart = await Cart.findOne({ user: req.user._id }) || 
             new Cart({ user: req.user._id, items: [] });

  // 4. Check for existing identical item
  const existingItem = cart.items.find(item =>
    item.product.equals(productId) &&
    item.variant?.color._id.equals(variant.color._id) &&
    item.variant?.size === variant.size
  );

  
  // 5. Update or add item
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: shoe._id,
      variant,
      quantity,
      price: shoe.discountedPrice || shoe.basePrice,
      productType: 'shoe',
      productModel: "Shoe",
      shoe: shoe._id
    });
  }

  await cart.save();

  // 6. Return populated cart
  const populatedCart = await Cart.populate(cart, {
    path: 'items.product items.variant.colorId item.shoe',
    select: 'name basePrice discountedPrice images colorOptions sizes hexCode name'
  });

  res.status(200).json(populatedCart);
})

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
// Updated removeFromCart controller
// controllers/cartController.js
export const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  // 1. First find the user's cart
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }


  // 3. Find the item index safely
  const itemIndex = cart.items.findIndex(item => 
    item._id && item._id.toString() === itemId
  );

  if (itemIndex === -1) {
    return res.status(404).json({ 
      message: 'Item not found in cart',
      availableItems: cart.items.map(item => ({
        _id: item._id?.toString(),
        product: item.product?.toString()
      }))
    });
  }

  // 4. Remove the item
  cart.items.splice(itemIndex, 1);
  await cart.save();

  // 5. Return updated cart
  const updatedCart = await Cart.findById(cart._id).populate('items.product');
  res.json(updatedCart);
});
// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
// controllers/cartController.js
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { itemId } = req.params;
  // console.log(quantity, itemId)

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'Invalid quantity' });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  // Find the item using mongoose's id comparison
  const item = cart.items.id(itemId);
  if (!item) {
    return res.status(404).json({ message: 'Item not found in cart' });
  }

  item.quantity = quantity;
  await cart.save();
  
  // Return populated cart with all necessary data
  const populatedCart = await Cart.populate(cart, {
    path: 'items.product',
    select: 'name price images productType magazineData',
    transform: (doc) => {
      if (!doc) return null;
      return {
        _id: doc._id,
        name: doc.name,
        price: doc.price,
        images: doc.images,
        productType: doc.productType,
        ...(doc.productType === 'magazine' && {
          magazineData: {
            issueNumber: doc.magazineData?.issueNumber,
            coverImage: doc.magazineData?.coverImage // Include cover image
          }
        })
      };
    }
  });

  res.json(populatedCart);
});



  // @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  // Two approaches - choose one:

  // Option 1: Remove the entire cart document
  await Cart.deleteOne({ _id: cart._id });

  // Option 2: Just empty the items array (keeps cart document)
  // cart.items = [];
  // await cart.save();

  res.status(200).json({ message: 'Cart cleared successfully' });
});

