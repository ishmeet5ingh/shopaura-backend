import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getCurrentUser,
  checkAuth, // Make sure this is imported
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Check auth status - This can work with or without token
router.get('/check', async (req, res) => {
  try {
    // Try to get token from cookie
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null
      });
    }
    
    // If token exists, verify it
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const User = (await import('../models/UserModel.js')).default;
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null
      });
    }
    
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Auth check error:', error.message);
    return res.status(200).json({
      success: true,
      authenticated: false,
      user: null
    });
  }
});

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/password', protect, changePassword);

export default router;
