// backend/controllers/addressController.js
import Address from '../models/AddressModel.js';
import mongoose from 'mongoose';

// @desc    Get all addresses for logged-in user
// @route   GET /api/addresses
// @access  Private (Buyer only)
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses
    });
  } catch (error) {
    console.error('❌ Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single address
// @route   GET /api/addresses/:id
// @access  Private (Buyer only)
export const getAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      address
    });
  } catch (error) {
    console.error('❌ Get address error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add new address
// @route   POST /api/addresses
// @access  Private (Buyer only)
export const addAddress = async (req, res) => {
  try {
    console.log('📍 Add Address - User ID:', req.user._id);
    console.log('📍 Add Address - Body:', req.body);
    
    const { fullName, phone, pincode, addressLine1, addressLine2, city, state, country, isDefault, addressType } = req.body;

    // Validate required fields
    if (!fullName || !phone || !pincode || !addressLine1 || !city || !state) {
      console.log('❌ Validation failed - Missing fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(phone)) {
      console.log('❌ Phone validation failed:', phone);
      return res.status(400).json({
        success: false,
        message: 'Please enter valid 10-digit phone number'
      });
    }

    // Validate pincode format
    if (!/^[0-9]{6}$/.test(pincode)) {
      console.log('❌ Pincode validation failed:', pincode);
      return res.status(400).json({
        success: false,
        message: 'Please enter valid 6-digit pincode'
      });
    }

    console.log('✅ Validation passed');

    // If this is set as default, unset other defaults
    if (isDefault) {
      console.log('📍 Unsetting other default addresses...');
      await Address.updateMany(
        { user: req.user._id },
        { isDefault: false }
      );
    }

    console.log('📍 Creating address document...');

    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      pincode,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      country: country || 'India',
      isDefault: isDefault || false,
      addressType: addressType || 'home'
    });

    console.log('✅ Address created successfully:', address._id);

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      address
    });
  } catch (error) {
    console.error('❌ Add address error:', error.message);
    console.error('❌ Error name:', error.name);
    console.error('❌ Full error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add address'
    });
  }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private (Buyer only)
export const updateAddress = async (req, res) => {
  try {
    let address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If setting this as default, unset other defaults
    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }

    address = await Address.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    console.error('❌ Update address error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private (Buyer only)
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await address.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete address error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private (Buyer only)
export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Unset all other defaults
    await Address.updateMany(
      { user: req.user._id },
      { isDefault: false }
    );

    // Set this as default
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated',
      address
    });
  } catch (error) {
    console.error('❌ Set default error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
