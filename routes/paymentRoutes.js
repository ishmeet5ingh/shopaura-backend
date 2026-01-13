import express from 'express';
import {
  createOrder,
  verifyPayment,
  handlePaymentFailure
} from '../controllers/paymentController.js';
import { protect, buyerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and buyer role
router.use(protect, buyerOnly);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/failed', handlePaymentFailure);

export default router;
