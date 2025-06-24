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

  coverImage:{
    url: String
  },

   // Variant Options
   colorOptions: [{
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    hexCode: String,
    images: [{
      url: String,
      publicId: String,
      isPrimary: Boolean
    }]
  }],
  
  sizeOptions: [Number], // [40, 41, 42,...]
  
  widthOptions: {
    type: [String],
    enum: ['Narrow', 'Standard', 'Wide', 'Extra Wide'],
    default: ['Standard']
  },
  
  soleOptions: [{
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    description: String
  }],
  
  lastOptions: [{
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    description: String,
    image: String
  }],
  
  materialOptions: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Leather', 'Synthetic', 'Textile', 'Rubber', "Suede"],
      default: 'Leather'
    },
    sustainabilityRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  }],

   // Variants
   variants: [{
    sku: String,
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shoe.colorOptions'
    },
    size: Number,
    width: String,
    soleType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shoe.soleOptions'
    },
    lastType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shoe.lastOptions'
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shoe.materialOptions'
    },
    priceAdjustment: Number,
    stock: Number,
    barcode: String
  }],

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

// Add _id to subdocuments if not present
shoeSchema.pre('save', function(next) {
  // Ensure all option arrays have _ids
  ['colorOptions', 'soleOptions', 'lastOptions', 'materialOptions'].forEach(field => {
    this[field] = this[field].map(option => {
      if (!option._id) {
        option._id = new mongoose.Types.ObjectId();
      }
      return option;
    });
  });

  // Generate variants if not present
  if (this.isNew && this.variants.length === 0) {
    this.variants = generateVariants(this);
  }

  // Generate SKUs
  this.variants.forEach(variant => {
    if (!variant.sku) {
      const colorIndex = this.colorOptions.findIndex(c => c._id.equals(variant.color));
      const soleIndex = this.soleOptions.findIndex(s => s._id.equals(variant.soleType));
      variant.sku = `SH-${this._id.toString().slice(-4)}-${colorIndex}${soleIndex}-${variant.size}-${variant.width.charAt(0)}`;
    }
  });

  next();
});

// Variant generation helper
function generateVariants(shoe) {
  const variants = [];
  
  shoe.colorOptions.forEach(color => {
    shoe.sizeOptions.forEach(size => {
      shoe.widthOptions.forEach(width => {
        shoe.soleOptions.forEach(sole => {
          shoe.lastOptions.forEach(last => {
            shoe.materialOptions.forEach(material => {
              variants.push({
                color: color._id,
                size,
                width,
                soleType: sole._id,
                lastType: last._id,
                material: material._id,
                priceAdjustment: 0,
                stock: 0
              });
            });
          });
        });
      });
    });
  });
  
  return variants;
}

const Shoe = mongoose.model('Shoe', shoeSchema);
export default Shoe;