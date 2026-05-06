const admin = require('../config/firebase');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    
    // Find or create the user in our database
    let user = await User.findOne({ email: decoded.email });
    
    if (!user) {
      // If user doesn't exist, create a minimal record
      user = await User.create({
        email: decoded.email,
        name: decoded.name || decoded.email,
        role: 'MEMBER'   // default role – can be changed later
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;