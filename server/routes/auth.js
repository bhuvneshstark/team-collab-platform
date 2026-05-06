const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/me', auth, async (req, res) => {
  // req.user is already populated by auth middleware (contains role, teamId, email, name, _id)
  res.json(req.user);
});

module.exports = router;