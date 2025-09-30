import clientPromise from '../../../lib/db/mongodb';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db('eco_bottle');
  const products = db.collection('products');

  try {
    if (req.method === 'GET') {
      // Get query parameters
      const { page = 1, limit = 20, category } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build filter
      const filter = { isActive: true };
      if (category) {
        filter.category = category;
      }

      // Get products
      const productsList = await products
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      // Get total count
      const total = await products.countDocuments(filter);

      res.status(200).json({
        products: productsList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } else if (req.method === 'POST') {
      // Verify authentication for creating products
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Please authenticate' });
      }

      try {
        const decoded = verifyToken(token);

        // Create product
        const newProduct = {
          ...req.body,
          isActive: true,
          rating: 4.5,
          reviewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await products.insertOne(newProduct);
        newProduct._id = result.insertedId;

        res.status(201).json({ product: newProduct });
      } catch (authError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ error: 'Operation failed' });
  }
}