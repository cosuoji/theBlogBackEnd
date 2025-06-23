import mongoose from 'mongoose';

const colorOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  hexCode: {
    type: String,
    required: true,
    match: /^#[0-9A-F]{6}$/i
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model('ColorOption', colorOptionSchema);