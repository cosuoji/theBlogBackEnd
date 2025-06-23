import mongoose from 'mongoose';

const shoeSchema = new mongoose.Schema({
  // Core Product Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },

  // Organization
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  tags: [String],

  // Variant Dimensions
  variantDimensions: {
    type: [String],
    default: ['color', 'size', 'width', 'soleType', 'lastType', 'material'],
    enum: ['color', 'size', 'width', 'soleType', 'lastType', 'material']
  },

  // Variant Options
  colorOptions: [{
    name: String,
    hexCode: String,
    images: [{
      url: String,
      publicId: String,
      isPrimary: Boolean
    }]
  }],
  
  sizeOptions: {
    type: [Number], // [40, 41, 42,...]
    default: Array.from({ length: 8 }, (_, i) => 40 + i) // Sizes 40-47
  },
  
  widthOptions: {
    type: [String],
    enum: ['Narrow', 'Standard', 'Wide', 'Extra Wide'],
    default: ['Standard']
  },
  
  soleOptions: [{
    name: String,
    description: String
  }],
  
  lastOptions: [{
    name: String,
    description: String,
    image: String
  }],
  
  materialOptions: [{
    name: String,
    type: {
      type: String,
      enum: ['Leather', 'Synthetic', 'Textile', 'Rubber']
    },
    sustainabilityRating: Number
  }],

  // Inventory & Pricing
  variants: [{
    sku: String,
    color: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'colorOptions'
    },
    size: Number,
    width: String,
    soleType: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'soleOptions'
    },
    lastType: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'lastOptions'
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'materialOptions'
    },
    priceAdjustment: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      default: 0
    },
    barcode: String
  }],

  // Technical Specifications
  weight: Number,
  careInstructions: [String],
  isCustomizable: Boolean,

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate SKUs automatically
shoeSchema.pre('save', function(next) {
  this.variants.forEach(variant => {
    if (!variant.sku) {
      variant.sku = `SH-${this._id.toString().slice(-4)}-${variant.color.toString().slice(-2)}-${variant.size}-${variant.width.charAt(0)}`;
    }
  });
  next();
});

// Indexes for faster queries
shoeSchema.index({ 'variants.sku': 1 });
shoeSchema.index({ 'variants.stock': 1 });

const Shoe = mongoose.model('Shoe', shoeSchema);
export default Shoe;