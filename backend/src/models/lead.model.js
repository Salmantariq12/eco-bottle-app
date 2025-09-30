const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1,
    default: 1
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  phoneNumber: {
    type: String,
    match: [/^[\d\s\-\+\(\)]+$/, 'Please provide a valid phone number']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    min: 0
  },
  notes: String,
  processedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

leadSchema.index({ email: 1, status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ productId: 1 });

leadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

leadSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

leadSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Lead', leadSchema);