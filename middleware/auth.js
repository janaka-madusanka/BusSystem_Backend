import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes — must be logged in
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    // ✅ 1. check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    // ✅ 2. check role exists
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User role missing',
      });
    }

    // ✅ 3. check permission
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role: ${req.user.role}`,
      });
    }

    next();
  };
};

export { protect, authorize };