import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  clearAllNotifications
} from '../controllers/notificationController.js';
import { protect, buyerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and buyer role
router.use(protect, buyerOnly);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/clear-all', clearAllNotifications);
router.delete('/:id', deleteNotification);

export default router;
