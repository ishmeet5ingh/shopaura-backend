import UserSettings from '../models/UserSettingsModel.js';
import User from '../models/UserModel.js';

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private (Buyer only)
export const getSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user.id });

    // Create default settings if not exists
    if (!settings) {
      settings = await UserSettings.create({ user: req.user.id });
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update notification settings
// @route   PUT /api/settings/notifications
// @access  Private (Buyer only)
export const updateNotificationSettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user.id });

    if (!settings) {
      settings = await UserSettings.create({ user: req.user.id });
    }

    settings.notifications = {
      ...settings.notifications,
      ...req.body
    };

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Notification settings updated',
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update privacy settings
// @route   PUT /api/settings/privacy
// @access  Private (Buyer only)
export const updatePrivacySettings = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user.id });

    if (!settings) {
      settings = await UserSettings.create({ user: req.user.id });
    }

    settings.privacy = {
      ...settings.privacy,
      ...req.body
    };

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated',
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update preferences (language, currency, region)
// @route   PUT /api/settings/preferences
// @access  Private (Buyer only)
export const updatePreferences = async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ user: req.user.id });

    if (!settings) {
      settings = await UserSettings.create({ user: req.user.id });
    }

    settings.preferences = {
      ...settings.preferences,
      ...req.body
    };

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated',
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add saved payment method
// @route   POST /api/settings/payment-methods
// @access  Private (Buyer only)
export const addPaymentMethod = async (req, res) => {
  try {
    const { type, last4, brand, expiryMonth, expiryYear, isDefault } = req.body;

    let settings = await UserSettings.findOne({ user: req.user.id });

    if (!settings) {
      settings = await UserSettings.create({ user: req.user.id });
    }

    // If this is the first payment method or marked as default
    if (settings.savedPaymentMethods.length === 0 || isDefault) {
      settings.savedPaymentMethods.forEach(pm => pm.isDefault = false);
    }

    settings.savedPaymentMethods.push({
      type,
      last4,
      brand,
      expiryMonth,
      expiryYear,
      isDefault: settings.savedPaymentMethods.length === 0 ? true : (isDefault || false)
    });

    await settings.save();

    res.status(201).json({
      success: true,
      message: 'Payment method added',
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete saved payment method
// @route   DELETE /api/settings/payment-methods/:id
// @access  Private (Buyer only)
export const deletePaymentMethod = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ user: req.user.id });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    settings.savedPaymentMethods = settings.savedPaymentMethods.filter(
      pm => pm._id.toString() !== req.params.id
    );

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Payment method deleted',
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete account
// @route   DELETE /api/settings/account
// @access  Private (Buyer only)
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to delete account'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Deactivate account instead of deleting
    user.isActive = false;
    await user.save();

    // Clear cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
