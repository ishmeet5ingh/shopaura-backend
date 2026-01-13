import express from 'express';
import {
  getCheckoutDetails,
  validateCoupon,
  calculateOrderSummary
} from '../controllers/checkoutController.js';
import { protect, buyerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and buyer role
router.use(protect, buyerOnly);

router.get('/', getCheckoutDetails);
router.post('/validate-coupon', validateCoupon);
router.post('/calculate', calculateOrderSummary);

export default router;
