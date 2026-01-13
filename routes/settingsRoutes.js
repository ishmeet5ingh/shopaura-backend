import express from 'express';
import {
  getSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  updatePreferences,
  addPaymentMethod,
  deletePaymentMethod,
  deleteAccount
} from '../controllers/settingsController.js';
import { protect, buyerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and buyer role
router.use(protect, buyerOnly);

router.get('/', getSettings);
router.put('/notifications', updateNotificationSettings);
router.put('/privacy', updatePrivacySettings);
router.put('/preferences', updatePreferences);

router.route('/payment-methods')
  .post(addPaymentMethod);

router.delete('/payment-methods/:id', deletePaymentMethod);
router.delete('/account', deleteAccount);

export default router;
