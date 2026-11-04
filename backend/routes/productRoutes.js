import express from 'express';
import Product from '../models/Product.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

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
      filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const [items, total] = await Promise.all([
      Product.find(filter).select('name price category description image created_at')
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

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, price, category, description = '', image = '' } = req.body;
  if (!name || !category || !Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ success: false, error: 'INVALID_PRODUCT' });
  }
  const product = await Product.create({ name, price: Number(price), category, description, image });
  res.status(201).json({ success: true, item: product });
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const allowed = ['name', 'price', 'category', 'description', 'image'];
  const changes = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (changes.price !== undefined && (!Number.isFinite(Number(changes.price)) || Number(changes.price) < 0)) {
    return res.status(400).json({ success: false, error: 'INVALID_PRICE' });
  }
  const product = await Product.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, error: 'PRODUCT_NOT_FOUND' });
  res.json({ success: true, item: product });
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'PRODUCT_NOT_FOUND' });
  res.json({ success: true });
});

export default router;
