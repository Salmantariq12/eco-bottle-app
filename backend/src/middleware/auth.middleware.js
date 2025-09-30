const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      ip: req.ip,
      path: req.path,
      error: error.message
    });
    res.status(401).json({ error: 'Please authenticate.' });
  }
};

const adminMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.warn('Admin access denied', {
      userId: req.user?._id,
      path: req.path
    });
    res.status(403).json({ error: 'Admin access required.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      req.user = user;
    }
  } catch (error) {
    // Silently continue without authentication
  }

  next();
};

module.exports = { authMiddleware, adminMiddleware, optionalAuth };