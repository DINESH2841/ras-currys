import express from 'express';
import { chat, productDescription } from '../controllers/aiController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public support chat is IP-limited; admin content generation also requires a JWT.
router.post('/chat', aiLimiter, chat);
router.post('/product-description', authenticateToken, requireAdmin, aiLimiter, productDescription);

export default router;
