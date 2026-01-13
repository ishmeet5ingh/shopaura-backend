import Notification from '../models/NotificationModel.js';
import UserSettings from '../models/UserSettingsModel.js';
import { sendEmail } from './emailService.js';
import { sendSMS } from './smsService.js';

// Send notification to user
export const sendNotification = async (userId, notificationData) => {
  try {
    const { type, title, message, relatedOrder, relatedProduct, priority = 'medium' } = notificationData;

    // Create in-app notification
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedOrder,
      relatedProduct,
      priority,
      sentVia: {
        inApp: true
      }
    });

    // Get user settings to check notification preferences
    const settings = await UserSettings.findOne({ user: userId });
    
    // Send email if enabled
    if (settings?.notifications?.emailNotifications?.orderUpdates && type === 'order') {
      // Email will be sent by specific functions in emailService
      notification.sentVia.email = true;
    }

    // Send SMS if enabled
    if (settings?.notifications?.smsNotifications?.orderUpdates && type === 'order') {
      // SMS will be sent by specific functions in smsService
      notification.sentVia.sms = true;
    }

    // Send push notification if enabled (implement with Socket.IO)
    if (settings?.notifications?.pushNotifications?.enabled) {
      const io = global.io;
      if (io) {
        io.to(userId.toString()).emit('notification', {
          id: notification._id,
          type,
          title,
          message,
          timestamp: notification.createdAt
        });
        notification.sentVia.push = true;
      }
    }

    await notification.save();

    return notification;
  } catch (error) {
    console.error('Send notification error:', error);
  }
};

// Send bulk notifications
export const sendBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map(userId => ({
      user: userId,
      ...notificationData,
      sentVia: { inApp: true }
    }));

    await Notification.insertMany(notifications);
    console.log(`Bulk notifications sent to ${userIds.length} users`);
  } catch (error) {
    console.error('Bulk notification error:', error);
  }
};

// Clear old notifications (run as cron job)
export const clearOldNotifications = async (days = 30) => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const result = await Notification.deleteMany({
      createdAt: { $lt: date },
      isRead: true
    });

    console.log(`Cleared ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('Clear old notifications error:', error);
  }
};
