import express from 'express';
import {
  getOrders,
  getOrder,
  cancelOrder,
  downloadInvoice,
  trackOrder
} from '../controllers/orderController.js';
import { protect, buyerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and buyer role
router.use(protect, buyerOnly);

router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);
router.get('/:id/invoice', downloadInvoice);
router.get('/:id/track', trackOrder);

export default router;
