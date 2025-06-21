// models/Blog.js
import mongoose from 'mongoose';

const contentBlockSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['text', 'image', 'pull-quote', 'side-by-side-images'] // Add new type here
  },
  // For text blocks
  content: { type: String },
  
  // For single image blocks
  src: { type: String },
  alt: { type: String },
  layout: { type: String },
  caption: { type: String },
  
  // For side-by-side images (new structure)
  images: {
    type: [{
      src: { type: String, required: true },
      alt: { type: String, required: true },
      caption: { type: String }
    }],
    validate: {
      validator: function(v) {
        // Only require images array for side-by-side type
        return this.type !== 'side-by-side-images' || (v && v.length >= 2);
      },
      message: 'Side-by-side images must have at least 2 images'
    }
  },
  
  // Keep your existing pairWith for backward compatibility
  pairWith: {
    src: { type: String },
    alt: { type: String },
    caption: { type: String }
  }
}, { _id: false });

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  headerImage: { type: String },
  innerImageForFeatured: {type: String},
  featured:{
    type:Boolean,
    default: false
  },
  magazineIssue:{type: String, index: true},
  category: {type: String, required: true},
  contentBlocks: [contentBlockSchema],
  author: {type: String},
  publishedAt: { type: Date, default: Date.now },
  tags: [String],
  magazineRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }
});

// Add pre-save hook to auto-generate slug
// blogSchema.pre('save', function(next) {
//     if (!this.slug) {
//       this.slug = slugify(this.title, {
//         lower: true,
//         strict: true // removes special characters
//       });
//     }
//     next();
//   });

export default mongoose.model('Blog', blogSchema);