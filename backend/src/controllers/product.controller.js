const { validationResult } = require('express-validator');
const Product = require('../models/product.model');
const logger = require('../logger');
const { dbOperationDuration } = require('../metrics');
const { invalidateProductCache } = require('../middleware/cache.middleware');

const getProducts = async (req, res) => {
  const startTime = Date.now();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter)
    ]);

    const duration = (Date.now() - startTime) / 1000;
    dbOperationDuration.observe({
      operation: 'find',
      collection: 'products',
      success: 'true'
    }, duration);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    dbOperationDuration.observe({
      operation: 'find',
      collection: 'products',
      success: 'false'
    }, duration);

    logger.error('Error fetching products', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const getProductById = async (req, res) => {
  const startTime = Date.now();
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const duration = (Date.now() - startTime) / 1000;
    dbOperationDuration.observe({
      operation: 'findById',
      collection: 'products',
      success: 'true'
    }, duration);

    res.json({ product });
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    dbOperationDuration.observe({
      operation: 'findById',
      collection: 'products',
      success: 'false'
    }, duration);

    logger.error('Error fetching product', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = new Product(req.body);
    await product.save();

    await invalidateProductCache();

    logger.info('Product created', { productId: product._id, name: product.name });
    res.status(201).json({ product });
  } catch (error) {
    logger.error('Error creating product', { error: error.message });
    res.status(500).json({ error: 'Failed to create product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await invalidateProductCache();

    logger.info('Product updated', { productId: product._id });
    res.json({ product });
  } catch (error) {
    logger.error('Error updating product', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await invalidateProductCache();

    logger.info('Product deactivated', { productId: product._id });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Error deleting product', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

const seedProducts = async (req, res) => {
  try {
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      return res.json({ message: 'Products already seeded', count: existingCount });
    }

    const sampleProducts = [
      {
        name: 'EcoBottle Classic 500ml',
        description: 'Our classic eco-friendly water bottle made from 100% recycled stainless steel. Perfect for daily hydration with double-wall vacuum insulation.',
        price: 24.99,
        originalPrice: 34.99,
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
        category: 'standard',
        features: ['BPA-Free', 'Leak-Proof', '24hr Cold / 12hr Hot', 'Recycled Materials'],
        stock: 150,
        capacity: '500ml',
        material: 'Recycled Stainless Steel',
        colors: ['Ocean Blue', 'Forest Green', 'Sunset Orange', 'Midnight Black'],
        rating: 4.5,
        reviewCount: 234
      },
      {
        name: 'EcoBottle Pro 750ml',
        description: 'Premium large capacity bottle with advanced temperature retention and ergonomic design. Ideal for athletes and outdoor enthusiasts.',
        price: 34.99,
        originalPrice: 44.99,
        imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400',
        category: 'premium',
        features: ['Triple Insulation', 'Sport Cap', 'Grip Coating', 'Carbon Neutral'],
        stock: 100,
        capacity: '750ml',
        material: 'Premium Recycled Steel',
        colors: ['Arctic White', 'Volcanic Black', 'Pacific Blue'],
        rating: 4.8,
        reviewCount: 189
      },
      {
        name: 'EcoBottle Kids 350ml',
        description: 'Safe and fun water bottle designed specifically for children. Features easy-grip design and spill-proof straw lid.',
        price: 19.99,
        imageUrl: 'https://images.unsplash.com/photo-1570831739435-6601a)aa3976a?w=400',
        category: 'standard',
        features: ['Kid-Safe Materials', 'Straw Lid', 'Dishwasher Safe', 'Fun Designs'],
        stock: 200,
        capacity: '350ml',
        material: 'Food-Grade Recycled Plastic',
        colors: ['Rainbow', 'Dinosaur Green', 'Princess Pink', 'Space Blue'],
        rating: 4.6,
        reviewCount: 412
      },
      {
        name: 'EcoBottle Limited Earth Day Edition',
        description: 'Exclusive limited edition bottle celebrating Earth Day. Features unique artwork and premium materials with proceeds supporting environmental causes.',
        price: 49.99,
        originalPrice: 59.99,
        imageUrl: 'https://images.unsplash.com/photo-1536939459926-301728717817?w=400',
        category: 'limited-edition',
        features: ['Limited Edition', 'Artist Design', 'Charity Partnership', 'Premium Packaging'],
        stock: 50,
        capacity: '600ml',
        material: 'Ocean-Recovered Plastic & Steel Hybrid',
        colors: ['Earth Day Special'],
        rating: 4.9,
        reviewCount: 67
      },
      {
        name: 'EcoBottle Travel 1L',
        description: 'Extra large capacity bottle perfect for long trips and adventures. Features integrated carabiner and compass.',
        price: 39.99,
        imageUrl: 'https://images.unsplash.com/photo-1523367259781-59e0763b0e73?w=400',
        category: 'premium',
        features: ['1L Capacity', 'Carabiner Clip', 'Built-in Compass', 'Impact Resistant'],
        stock: 75,
        capacity: '1000ml',
        material: 'Military-Grade Recycled Aluminum',
        colors: ['Desert Sand', 'Jungle Green', 'Urban Grey'],
        rating: 4.7,
        reviewCount: 145
      }
    ];

    const products = await Product.insertMany(sampleProducts);
    await invalidateProductCache();

    logger.info('Products seeded successfully', { count: products.length });
    res.json({ message: 'Products seeded successfully', count: products.length });
  } catch (error) {
    logger.error('Error seeding products', { error: error.message });
    res.status(500).json({ error: 'Failed to seed products' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts
};