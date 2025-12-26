import express from 'express';
import Ticket from '../models/Ticket.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tickets?user_id=xxx - Get tickets for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.query.user_id || req.user.userId;
    
    const tickets = await Ticket.find({ createdByUserId: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tickets: tickets.map(t => ({
        id: t._id.toString(),
        issueSummary: t.issueSummary,
        urgency: t.urgency,
        userContact: t.userContact,
        status: t.status,
        created_by_user_id: t.createdByUserId.toString(),
        created_at: t.createdAt
      }))
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
});

// POST /api/tickets - Create a new ticket
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { issueSummary, urgency, userContact } = req.body;

    const ticket = await Ticket.create({
      issueSummary,
      urgency: urgency || 'medium',
      userContact,
      createdByUserId: req.user.userId,
      status: 'open'
    });

    res.status(201).json({
      success: true,
      ticket: {
        id: ticket._id.toString(),
        issueSummary: ticket.issueSummary,
        urgency: ticket.urgency,
        userContact: ticket.userContact,
        status: ticket.status,
        created_by_user_id: ticket.createdByUserId.toString(),
        created_at: ticket.createdAt
      }
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

export default router;
