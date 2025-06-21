import asyncHandler from 'express-async-handler';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';

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
  const { productId, variant, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Validate variant if it's a regular product
  if (product.productType === 'regular' && variant) {
    const variantExists = product.variants.some(
      v => v.name === variant.name && 
      v.options.some(opt => opt.name === variant.option)
    );
    if (!variantExists) {
      return res.status(400).json({ message: 'Invalid variant' });
    }
  }

  let cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    cart = new Cart({ 
      user: req.user._id, 
      items: [] 
    });
  }

  // Find existing item
  const existingItemIndex = cart.items.findIndex(item => 
    item.product.equals(productId) && 
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      variant,
      quantity,
      price: product.price,
      productType: product.productType
    });
  }

  await cart.save();
  
  // Return populated cart
  const populatedCart = await Cart.populate(cart, {
    path: 'items.product',
    select: 'name price images productType magazineData'
  });

  res.status(201).json(populatedCart);
});

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

  //2. Debug logging (safe version)
  // console.log('Cart items before removal:', {
  //   itemCount: cart.items.length,
  //   firstItem: cart.items[0] ? {
  //     _id: cart.items[0]._id?.toString(),
  //     product: cart.items[0].product?.toString()
  //   } : null,
  //   requestedId: itemId
  // });

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

