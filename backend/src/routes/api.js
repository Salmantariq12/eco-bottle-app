const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const productController = require('../controllers/product.controller');
const leadController = require('../controllers/lead.controller');
const { authMiddleware, adminMiddleware, optionalAuth } = require('../middleware/auth.middleware');
const { apiLimiter, authLimiter, strictLimiter } = require('../middleware/rateLimit.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');

const router = express.Router();

router.use('/auth/register', authLimiter);
router.use('/auth/login', authLimiter);

router.post('/auth/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.register);

router.post('/auth/login', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

router.post('/auth/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], authController.refresh);

router.post('/auth/logout', authMiddleware, authController.logout);

router.get('/auth/profile', authMiddleware, authController.getProfile);

router.get('/products',
  optionalAuth,
  cacheMiddleware({ ttl: 30, cacheType: 'products' }),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isIn(['standard', 'premium', 'limited-edition']).withMessage('Invalid category')
  ],
  productController.getProducts
);

router.get('/products/:id',
  optionalAuth,
  cacheMiddleware({ ttl: 60, cacheType: 'product' }),
  [
    param('id').isMongoId().withMessage('Invalid product ID')
  ],
  productController.getProductById
);

router.post('/products',
  authMiddleware,
  adminMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('imageUrl').isURL().withMessage('Invalid image URL'),
    body('category').isIn(['standard', 'premium', 'limited-edition']).withMessage('Invalid category'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
  ],
  productController.createProduct
);

router.put('/products/:id',
  authMiddleware,
  adminMiddleware,
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative')
  ],
  productController.updateProduct
);

router.delete('/products/:id',
  authMiddleware,
  adminMiddleware,
  [
    param('id').isMongoId().withMessage('Invalid product ID')
  ],
  productController.deleteProduct
);

router.post('/products/seed',
  authMiddleware,
  adminMiddleware,
  productController.seedProducts
);

router.post('/leads',
  apiLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('productId').isMongoId().withMessage('Invalid product ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('phoneNumber').optional().matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number'),
    body('address.street').optional().trim(),
    body('address.city').optional().trim(),
    body('address.state').optional().trim(),
    body('address.zipCode').optional().trim(),
    body('address.country').optional().trim()
  ],
  leadController.createLead
);

router.get('/leads',
  authMiddleware,
  adminMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'cancelled']).withMessage('Invalid status')
  ],
  leadController.getLeads
);

router.get('/leads/stats',
  authMiddleware,
  adminMiddleware,
  cacheMiddleware({ ttl: 300, cacheType: 'stats' }),
  leadController.getLeadStats
);

router.get('/leads/:id',
  authMiddleware,
  [
    param('id').isMongoId().withMessage('Invalid lead ID')
  ],
  leadController.getLeadById
);

router.patch('/leads/:id/status',
  authMiddleware,
  adminMiddleware,
  [
    param('id').isMongoId().withMessage('Invalid lead ID'),
    body('status').isIn(['pending', 'processing', 'completed', 'cancelled']).withMessage('Invalid status')
  ],
  leadController.updateLeadStatus
);

// Test endpoint to add products without authentication (for development/testing only)
router.post('/products/test', [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('imageUrl').isURL().withMessage('Invalid image URL'),
  body('category').isIn(['standard', 'premium', 'limited-edition']).withMessage('Invalid category'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], productController.createProduct);

// Test endpoint to create admin user (for development/testing only)
router.post('/auth/create-admin', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const User = require('../models/user.model');

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create admin user
    const user = new User({
      name,
      email,
      password,
      role: 'admin'
    });

    await user.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;