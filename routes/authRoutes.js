import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  checkAuth,
  updateProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.get('/check', checkAuth);
router.put('/profile', protect, updateProfile);

export default router;
