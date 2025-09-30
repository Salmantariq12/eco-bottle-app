import clientPromise from '../../../lib/db/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db('eco_bottle');
  const leads = db.collection('leads');

  try {
    if (req.method === 'POST') {
      // Create a new lead (order)
      const { name, email, productId, quantity, phoneNumber, address } = req.body;

      // Validate required fields
      if (!name || !email || !productId || !quantity) {
        return res.status(400).json({
          error: 'Name, email, product, and quantity are required'
        });
      }

      // Create lead document
      const newLead = {
        name,
        email: email.toLowerCase(),
        productId: new ObjectId(productId),
        quantity: parseInt(quantity),
        phoneNumber,
        address,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await leads.insertOne(newLead);
      newLead._id = result.insertedId;

      res.status(201).json({
        message: 'Order placed successfully',
        orderId: result.insertedId,
        lead: newLead
      });

    } else if (req.method === 'GET') {
      // Get leads (requires authentication)
      const { page = 1, limit = 20, status } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build filter
      const filter = {};
      if (status) {
        filter.status = status;
      }

      // Get leads
      const leadsList = await leads
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      // Get total count
      const total = await leads.countDocuments(filter);

      res.status(200).json({
        leads: leadsList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Leads API error:', error);
    res.status(500).json({ error: 'Operation failed' });
  }
}