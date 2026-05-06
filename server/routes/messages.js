const express = require('express');
const router = express.Router();
const Joi = require('joi');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Validation schema
const messageSchema = Joi.object({
  content: Joi.string().required().trim().min(1).max(5000)
});

// GET messages for the user's team (with pagination support)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ teamId: req.user.teamId })
      .populate('senderId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const count = await Message.countDocuments({ teamId: req.user.teamId });

    res.json({
      messages,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new message (also emits via Socket.IO if the `io` object is passed)
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = messageSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const message = await Message.create({
      content: value.content,
      senderId: req.user._id,
      teamId: req.user.teamId,
      timestamp: new Date()
    });

    const populated = await message.populate('senderId', 'name email');

    // If Socket.IO instance is attached to the app, emit the message
    if (req.app.get('io')) {
      req.app.get('io')
        .to(req.user.teamId.toString())
        .emit('new-message', populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;