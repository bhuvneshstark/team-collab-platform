const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET all members of the current user's team
router.get('/team-members', auth, async (req, res) => {
  try {
    if (!req.user.teamId) {
      return res.status(400).json({ error: 'You are not in a team' });
    }
    const members = await User.find({ teamId: req.user.teamId }).select('_id name email role');
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;