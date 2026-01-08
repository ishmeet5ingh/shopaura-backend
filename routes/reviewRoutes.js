import express from 'express';
import {
  getProductReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  unmarkReviewHelpful,
  getMyReviews,
  addReviewResponse,
  updateReviewStatus,
  getAllReviews
} from '../controllers/reviewController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);
router.get('/:id', getReviewById);

// Protected routes - All authenticated users
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, markReviewHelpful);
router.delete('/:id/helpful', protect, unmarkReviewHelpful);
router.get('/my/reviews', protect, getMyReviews);

// Seller and Admin can respond to reviews
router.post('/:id/response', protect, restrictTo('seller', 'admin'), addReviewResponse);

// Admin only routes
router.get('/admin/all', protect, restrictTo('admin'), getAllReviews);
router.patch('/:id/status', protect, restrictTo('admin'), updateReviewStatus);

export default router;
