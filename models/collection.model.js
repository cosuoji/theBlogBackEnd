import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: String,
  season: String,
  year: Number,
  coverImage: {
    url: String,
    publicId: String
  },
  isActive: Boolean
}, { timestamps: true });

export default mongoose.model('Collection', collectionSchema);