import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: [0, 'Discount cannot be negative']
  },
  minimumPurchase: {
    type: Number,
    min: [0, 'Minimum purchase cannot be negative']
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  maxUses: {
    type: Number,
    min: [1, 'Max uses must be at least 1']
  },
  currentUses: {
    type: Number,
    default: 0,
    min: [0, 'Current uses cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  appliesTo: {
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }]
  }
}, {
  timestamps: true
});

// Validate coupon dates
couponSchema.pre('save', function(next) {
  if (this.endDate < new Date()) {
    this.isActive = false;
  }
  next();
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;