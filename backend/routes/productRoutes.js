import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/products?page=&limit=&category=&search=
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const category = (req.query.category || '').toString().trim().toLowerCase();
    const search = (req.query.search || '').toString().trim();

    const filter = {};
    if (category && category !== 'all') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      items,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

export default router;