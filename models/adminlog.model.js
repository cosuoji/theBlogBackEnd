// models/AdminLog.js
import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: ['pending','shipped', 'delivered', "cancelled"], // Add as needed
      required: true
    },
    targetOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    note: {
      type: String // Optional, for extra context
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt automatically
  }
);

const AdminLog = mongoose.model('AdminLog', adminLogSchema);
export default AdminLog;
