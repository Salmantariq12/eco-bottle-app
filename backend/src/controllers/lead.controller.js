const { validationResult } = require('express-validator');
const Lead = require('../models/lead.model');
const Product = require('../models/product.model');
const logger = require('../logger');
const { dbOperationDuration } = require('../metrics');

let isHighLoad = false;
let lastHighLoadCheck = Date.now();

const checkHighLoad = () => {
  const now = Date.now();
  if (now - lastHighLoadCheck > 5000) {
    const memoryUsage = process.memoryUsage();
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    isHighLoad = heapUsedPercent > 85;
    lastHighLoadCheck = now;
  }
  return isHighLoad;
};

const createLead = async (req, res) => {
  const startTime = Date.now();

  if (process.env.NODE_ENV !== 'development' && checkHighLoad()) {
    logger.warn('System under high load, returning 503', {
      ip: req.ip,
      path: req.path
    });
    res.setHeader('Retry-After', '60');
    return res.status(503).json({
      error: 'Service temporarily unavailable due to high load',
      retryAfter: 60
    });
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, productId, quantity, address, phoneNumber } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock available' });
    }

    const totalAmount = product.price * quantity;

    const lead = new Lead({
      name,
      email,
      productId,
      quantity,
      address,
      phoneNumber,
      totalAmount,
      status: 'pending'
    });

    await lead.save();

    product.stock -= quantity;
    await product.save();

    const duration = (Date.now() - startTime) / 1000;
    dbOperationDuration.observe({
      operation: 'create',
      collection: 'leads',
      success: 'true'
    }, duration);

    logger.info('Lead created successfully', {
      leadId: lead._id,
      email,
      productId,
      quantity
    });

    setTimeout(() => {
      processLeadAsync(lead._id);
    }, 100);

    res.status(202).json({
      message: 'Order received and is being processed',
      orderId: lead._id,
      status: 'pending',
      estimatedProcessingTime: '2-3 minutes'
    });
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    dbOperationDuration.observe({
      operation: 'create',
      collection: 'leads',
      success: 'false'
    }, duration);

    logger.error('Error creating lead', { error: error.message });
    res.status(500).json({ error: 'Failed to process order' });
  }
};

const processLeadAsync = async (leadId) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        status: 'processing',
        processedAt: new Date()
      },
      { new: true }
    );

    logger.info('Lead processing started', { leadId });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await Lead.findByIdAndUpdate(
      leadId,
      {
        status: 'completed',
        completedAt: new Date()
      }
    );

    logger.info('Lead processing completed', { leadId });
  } catch (error) {
    logger.error('Error processing lead asynchronously', {
      leadId,
      error: error.message
    });

    await Lead.findByIdAndUpdate(leadId, { status: 'failed' });
  }
};

const getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('product')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Lead.countDocuments(filter)
    ]);

    res.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching leads', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('product');

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ lead });
  } catch (error) {
    logger.error('Error fetching lead', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: new Date(),
        ...(status === 'processing' && { processedAt: new Date() }),
        ...(status === 'completed' && { completedAt: new Date() })
      },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    logger.info('Lead status updated', {
      leadId: lead._id,
      oldStatus: lead.status,
      newStatus: status
    });

    res.json({ lead });
  } catch (error) {
    logger.error('Error updating lead status', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update lead status' });
  }
};

const getLeadStats = async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          totalAmount: 1,
          _id: 0
        }
      }
    ]);

    const totalLeads = await Lead.countDocuments();
    const last24Hours = await Lead.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      stats,
      summary: {
        total: totalLeads,
        last24Hours
      }
    });
  } catch (error) {
    logger.error('Error fetching lead stats', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch lead statistics' });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  getLeadStats
};