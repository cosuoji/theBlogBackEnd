import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // or 'Shoe' if you're separating collections
    required: true
  },
  variant: {
    color: {
      _id: mongoose.Schema.Types.ObjectId,
      name: String,
      hexCode: String,
      images: [Object]
    },
    size: Number,
    width: String,
    last: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Last'
    },
    sole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sole'
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  productType: {
    type: String,
    enum: ['shoe', 'magazine', 'default'], // adapt this to your system
    default: 'default'
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  discount: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal - this.discount;
  next();
});

// Static method to get or create cart for user
cartSchema.statics.getUserCart = async function(userId) {
  let cart = await this.findOne({ user: userId }).populate('items.product');
  
  if (!cart) {
    cart = new this({ user: userId, items: [] });
    await cart.save();
  }
  
  return cart;
};

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;

// Cart Variant Example 
// {
//     product: "60d5f8a9e8b9a71f2c7e3f1a", // T-Shirt ID
//     variant: {
//       name: "Color", 
//       option: "Red"    // Customer chose Red
//     },
//     quantity: 2,
//     price: 19.99       // Base price + variant adjustments (if any)
//   }