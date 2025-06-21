import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [120, 'Product name cannot exceed 120 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be at least 0']
  },
  productType: {
    type: String,
    enum: ['regular', 'magazine', "shoe"],
    default: 'regular'
  },
  magazineData: {
    issueNumber: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'Issue number must be an integer'
      }
    },
    coverImage: {
      url: String,
      publicId: String
    },
    publishDate: Date,
    pages: Number,
    isFeatured: Boolean
  },
  comparePrice: {
    type: Number,
    validate: {
      validator: function(value) {
        return value >= this.price;
      },
      message: 'Compare price must be greater than or equal to price'
    }
  },
  shoeData: {
    colors: [{
      name: String,
      hexCode: String,
      images: [{
        url: String,
        publicId: String,
        isPrimary: Boolean
      }]
    }],
    sizes: [{
      size: Number,
      stock: Number
    }],
    materials: [String],
    gender: {
      type: String,
      enum: ['men', 'women', 'unisex']
    }
  },
  images: [
    {
      url: String,
      altText: String
    }
  ],
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [String],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  variants: [{
    name: String,
    options: [{
      name: String,
      priceAdjustment: Number,
      stock: Number
    }]
  }],
  shippingInfo: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for product URL
productSchema.virtual('url').get(function() {
  return `/products/${this.slug}`;
});

// Pre-save hook to generate slug
productSchema.pre('save', function(next) {
  if (!this.isModified('name')) return next();
  this.slug = this.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;


// Variants example
// {
//     name: "T-Shirt",
//     variants: [{
//       name: "Size",
//       options: [
//         { name: "S", priceAdjustment: 0, stock: 10 },
//         { name: "M", priceAdjustment: 0, stock: 15 },
//         { name: "L", priceAdjustment: 2.00, stock: 8 } // L costs $2 more
//       ]
//     }, {
//       name: "Color",
//       options: [
//         { name: "Red", priceAdjustment: 0, stock: 5 },
//         { name: "Blue", priceAdjustment: 1.50, stock: 12 } // Blue costs $1.50 more
//       ]
//     }]
//   }