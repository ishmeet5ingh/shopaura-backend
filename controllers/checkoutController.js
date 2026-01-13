import Cart from '../models/CartModel.js';
import Address from '../models/AddressModel.js';
import Order from '../models/OrderModel.js';
import Product from '../models/ProductModel.js';
import Coupon from '../models/CouponModel.js';

// @desc    Get checkout details
// @route   GET /api/checkout
// @access  Private (Buyer only)
export const getCheckoutDetails = async (req, res) => {
  try {
    // Get cart items
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Get user's addresses
    const addresses = await Address.find({ user: req.user.id }).sort('-isDefault');

    // Calculate pricing
    let itemsPrice = 0;
    const cartItems = [];

    for (const item of cart.items) {
      if (!item.product) continue;

      const product = item.product;
      const itemTotal = product.price * item.quantity;
      itemsPrice += itemTotal;

      cartItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0]?.url || ''
      });
    }

    // Calculate tax (18% GST)
    const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100;

    // Calculate shipping (free above 500)
    const shippingPrice = itemsPrice > 500 ? 0 : 40;

    // Total price
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    res.status(200).json({
      success: true,
      checkout: {
        items: cartItems,
        addresses,
        pricing: {
          itemsPrice: Math.round(itemsPrice * 100) / 100,
          taxPrice,
          shippingPrice,
          totalPrice: Math.round(totalPrice * 100) / 100,
          discountAmount: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Validate coupon code
// @route   POST /api/checkout/validate-coupon
// @access  Private (Buyer only)
export const validateCoupon = async (req, res) => {
  try {
    const { code, itemsPrice } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide coupon code'
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validUntil: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    // Check minimum purchase amount
    if (itemsPrice < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached'
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (itemsPrice * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discountAmount,
        description: coupon.description
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Calculate order summary
// @route   POST /api/checkout/calculate
// @access  Private (Buyer only)
export const calculateOrderSummary = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate items price
    let itemsPrice = 0;
    for (const item of cart.items) {
      if (item.product) {
        itemsPrice += item.product.price * item.quantity;
      }
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validUntil: { $gte: new Date() }
      });

      if (coupon && itemsPrice >= coupon.minPurchaseAmount) {
        if (coupon.discountType === 'percentage') {
          discountAmount = (itemsPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        } else {
          discountAmount = coupon.discountValue;
        }
        appliedCoupon = coupon.code;
      }
    }

    const taxPrice = Math.round((itemsPrice - discountAmount) * 0.18 * 100) / 100;
    const shippingPrice = itemsPrice > 500 ? 0 : 40;
    const totalPrice = itemsPrice - discountAmount + taxPrice + shippingPrice;

    res.status(200).json({
      success: true,
      summary: {
        itemsPrice: Math.round(itemsPrice * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        taxPrice,
        shippingPrice,
        totalPrice: Math.round(totalPrice * 100) / 100,
        appliedCoupon
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
