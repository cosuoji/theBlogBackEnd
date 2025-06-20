import mongoose from 'mongoose';

const magazineSchema = new mongoose.Schema({
  issueNumber: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  pages: {
    type: Number,
    required: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  tags: [{
    type: String
  }],
  digitalDownloadUrl: {
    type: String // Optional for digital purchases
  }
}, { timestamps: true });

export default mongoose.model('Magazine', magazineSchema);