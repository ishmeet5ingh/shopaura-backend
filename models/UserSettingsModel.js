import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  notifications: {
    emailNotifications: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
      priceDropAlerts: { type: Boolean, default: true }
    },
    smsNotifications: {
      orderUpdates: { type: Boolean, default: true },
      deliveryUpdates: { type: Boolean, default: true }
    },
    pushNotifications: {
      enabled: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    }
  },
  privacy: {
    showProfile: { type: Boolean, default: true },
    showWishlist: { type: Boolean, default: false },
    showReviews: { type: Boolean, default: true }
  },
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'INR'
    },
    region: {
      type: String,
      default: 'IN'
    }
  },
  savedPaymentMethods: [{
    type: {
      type: String,
      enum: ['card', 'upi', 'wallet']
    },
    last4: String,
    brand: String,
    expiryMonth: String,
    expiryYear: String,
    isDefault: Boolean
  }]
}, {
  timestamps: true
});

export default mongoose.model('UserSettings', userSettingsSchema);
