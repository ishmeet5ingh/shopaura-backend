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

// ✅ IMPORTANT: Specific routes BEFORE dynamic routes

// Admin only routes - FIRST
router.get('/admin/all', protect, restrictTo('admin'), getAllReviews);

// User's own reviews - BEFORE /:id
router.get('/my/reviews', protect, getMyReviews);

// Product reviews - BEFORE /:id
router.get('/product/:productId', getProductReviews);

// Protected routes - All authenticated users
router.post('/', protect, createReview);

// Dynamic routes - AFTER specific routes
router.get('/:id', getReviewById);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, markReviewHelpful);
router.delete('/:id/helpful', protect, unmarkReviewHelpful);

// Seller and Admin can respond to reviews
router.post('/:id/response', protect, restrictTo('seller', 'admin'), addReviewResponse);

// Admin status update
router.patch('/:id/status', protect, restrictTo('admin'), updateReviewStatus);

export default router;
