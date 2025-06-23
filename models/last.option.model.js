import mongoose from 'mongoose';

const lastOptionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  description: String,
  toeShape: {
    type: String,
    enum: ['Round', 'Square', 'Pointed', 'Almond']
  },
  image: {
    url: String,
    publicId: String
  }
});

export default mongoose.model('LastOption', lastOptionSchema);