const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Guild token missing.'
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_rpg_guild_master_key_16bit_fantasy'
    );

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Attach user to request object
    req.user = user;
    req.hero = user; // Alias for backwards compatibility
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed. Please sign in again.',
      error: error.message
    });
  }
};

module.exports = {
  protect,
  protectHero: protect
};
