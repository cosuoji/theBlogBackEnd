import mongoose from 'mongoose';

const materialOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['Leather', 'Synthetic', 'Textile', 'Rubber', 'Suede'],
    required: true
  },
  description: String,
  sustainabilityData: {
    isRecycled: Boolean,
    waterUsage: Number, // liters per kg
    co2Footprint: Number // kg CO2 per kg
  }
});

export default mongoose.model('MaterialOption', materialOptionSchema);