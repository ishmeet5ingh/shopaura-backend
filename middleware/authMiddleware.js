import jwt from 'jsonwebtoken';
import User from '../models/UserModel.js';



// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from httpOnly cookie
    if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, please login' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'User account is deactivated' 
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Restrict access to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

export const buyerOnly = (req, res, next) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This section is for buyers only.',
      redirectTo: process.env.ADMIN_PANEL_URL || 'http://localhost:5174'
    });
  }
  next();
};