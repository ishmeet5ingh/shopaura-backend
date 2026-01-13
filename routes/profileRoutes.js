import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  changePassword
} from '../controllers/profileController.js';
import { protect, buyerOnly } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/multerConfig.js';

const router = express.Router();

// All routes require authentication and buyer role
router.use(protect, buyerOnly);

router.route('/')
  .get(getProfile)
  .put(updateProfile);

router.route('/picture')
  .post(upload.single('profilePicture'), uploadProfilePicture)
  .delete(deleteProfilePicture);

router.put('/password', changePassword);

export default router;
