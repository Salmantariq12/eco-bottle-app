const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: 1000
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  imageUrl: {
    type: String,
    required: [true, 'Product image URL is required']
  },
  category: {
    type: String,
    required: true,
    enum: ['standard', 'premium', 'limited-edition'],
    default: 'standard'
  },
  features: [{
    type: String
  }],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  capacity: {
    type: String,
    required: true,
    default: '500ml'
  },
  material: {
    type: String,
    required: true,
    default: 'Recycled Stainless Steel'
  },
  colors: [{
    type: String
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 4.5
  },
  reviewCount: {
    type: Number,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isActive: 1 });

productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Product', productSchema);