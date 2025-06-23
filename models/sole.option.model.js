import mongoose from 'mongoose';

const soleOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  image: {
    url: String,
    publicId: String
  },
  material: String,
  thickness: Number // in mm
});

export default mongoose.model('SoleOption', soleOptionSchema);