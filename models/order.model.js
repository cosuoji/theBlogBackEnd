import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: Object, // Store the full product object
    required: true
  },
  variant: {
    name: Object,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    type: {
      type: String,
      enum: ['home', 'work', 'other']
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  billingAddress: {
    type: {
      type: String,
      enum: ['home', 'work', 'other']
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'paypal', 'stripe', 'cod', "paystack"],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'failed', 'refunded', "Successful"],
      default: 'pending'
    },
    transactionId: String,
    reference: String,
    amount: Number
  },
  shipping: {
    method: String,
    cost: Number,
    trackingNumber: String,
    carrier: String
  },
  subtotal: {
    type: Number,
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "shipped", "delivered"],
    default: 'pending'
  },
  firstName: String, 
  lastName: String, 
  notes: String,
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal + this.tax - this.discount;
  next();
});

// Static method to get user orders
orderSchema.statics.getUserOrders = async function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const orders = await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.product');
    
  const total = await this.countDocuments({ user: userId });
  
  return {
    orders,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page
  };
};

orderSchema.index({ createdAt: -1 }); // For sorting/searching by date
orderSchema.index({ 'user.email': 1 }); // Optional if you want to search by email


const Order = mongoose.model('Order', orderSchema);
export default Order;