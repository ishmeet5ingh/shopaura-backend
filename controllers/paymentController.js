// backend/controllers/paymentController.js
import Order from "../models/OrderModel.js";
import Payment from "../models/PaymentModel.js";
import Cart from "../models/CartModel.js";
import Product from "../models/ProductModel.js";
import Coupon from "../models/CouponModel.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../services/paymentService.js";
import { sendNotification } from "../services/notificationService.js";
import { sendOrderConfirmationEmail } from "../services/emailService.js";

// @desc    Create order and initiate payment
// @route   POST /api/payment/create-order
// @access  Private (Buyer only)
export const createOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, couponCode } = req.body;

    console.log("📦 Create Order - User:", req.user._id);
    console.log("📦 Create Order - Data:", req.body);

    // Validation
    if (!addressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Please provide address and payment method",
      });
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Get address
    const Address = (await import("../models/AddressModel.js")).default;
    const address = await Address.findOne({
      _id: addressId,
      user: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Calculate order pricing
    let itemsPrice = 0;
    const orderItems = [];

    for (const item of cart.items) {
      if (!item.product) continue;

      const product = item.product;

      // Check stock
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      itemsPrice += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        images: product.images || [], // ✅ Save the entire images array
      });
    }

    // Apply coupon
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validUntil: { $gte: new Date() },
      });

      if (coupon && itemsPrice >= coupon.minPurchaseAmount) {
        if (coupon.discountType === "percentage") {
          discountAmount = (itemsPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        } else {
          discountAmount = coupon.discountValue;
        }

        // Update coupon usage
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const taxPrice =
      Math.round((itemsPrice - discountAmount) * 0.18 * 100) / 100;
    const shippingPrice = itemsPrice > 500 ? 0 : 40;
    const totalPrice =
      Math.round(
        (itemsPrice - discountAmount + taxPrice + shippingPrice) * 100
      ) / 100;

    // Calculate estimated delivery (7 days from now)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },
      paymentMethod,
      itemsPrice: Math.round(itemsPrice * 100) / 100,
      taxPrice,
      shippingPrice,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalPrice,
      couponCode: couponCode || undefined,
      estimatedDeliveryDate,
    });

    console.log("✅ Order created:", order._id);

    // Handle payment based on method
    if (paymentMethod === "cod") {
      // Cash on Delivery - Order confirmed immediately
      order.paymentStatus = "pending";
      order.orderStatus = "confirmed";
      order.statusHistory.push({
        status: "confirmed",
        note: "Order confirmed - Cash on Delivery",
      });
      await order.save();

      // Create payment record
      await Payment.create({
        user: req.user._id,
        order: order._id,
        paymentMethod: "cod",
        paymentGateway: "cod",
        amount: totalPrice,
        status: "pending",
      });

      // Update product stock
      for (const item of cart.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product._id, {
            $inc: { stock: -item.quantity },
          });
        }
      }

      // Clear cart
      await Cart.findByIdAndDelete(cart._id);

      // Send notifications
      try {
        await sendNotification(req.user._id, {
          type: "order",
          title: "Order Confirmed",
          message: `Your order #${order.orderNumber} has been confirmed`,
          relatedOrder: order._id,
        });
      } catch (notifError) {
        console.log("Notification error (non-critical):", notifError.message);
      }

      try {
        await sendOrderConfirmationEmail(req.user._id, order);
      } catch (emailError) {
        console.log("Email error (non-critical):", emailError.message);
      }

      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order,
        paymentMethod: "cod",
      });
    }

    // ✅ CHANGED: For online payments - Added 'online' to the condition
    if (
      paymentMethod === "online" ||
      ["card", "upi", "netbanking", "wallet"].includes(paymentMethod)
    ) {
      const razorpayOrder = await createRazorpayOrder(
        totalPrice,
        order.orderNumber
      );

      // Create payment record
      await Payment.create({
        user: req.user._id,
        order: order._id,
        paymentMethod,
        paymentGateway: "razorpay",
        amount: totalPrice,
        razorpayOrderId: razorpayOrder.id,
        status: "pending",
      });

      return res.status(201).json({
        success: true,
        message: "Order created, proceed with payment",
        order,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    // ✅ If we reach here, payment method is invalid
    res.status(400).json({
      success: false,
      message: "Invalid payment method",
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify payment and confirm order
// @route   POST /api/payment/verify
// @access  Private (Buyer only)
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    console.log("🔐 Verify Payment - User:", req.user._id);

    // Verify signature
    const isValid = verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Find payment
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Update payment
    payment.status = "completed";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.transactionId = razorpay_payment_id;
    await payment.save();

    // Update order
    const order = await Order.findById(payment.order);
    order.paymentStatus = "completed";
    order.orderStatus = "confirmed";
    order.statusHistory.push({
      status: "confirmed",
      note: "Payment successful - Order confirmed",
    });
    await order.save();

    // Update product stock
   const cart = await Cart.findOne({ user: req.user._id })
  .populate({
    path: 'items.product',
    select: 'name price images stock'  // ✅ Make sure 'images' is explicitly selected
  });
    
    if (cart) {
      for (const item of cart.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product._id, {
            $inc: { stock: -item.quantity },
          });
        }
      }
      // Clear cart
      await Cart.findByIdAndDelete(cart._id);
    }

    // Send notifications
    try {
      await sendNotification(req.user._id, {
        type: "payment",
        title: "Payment Successful",
        message: `Payment of ₹${payment.amount} completed successfully`,
        relatedOrder: order._id,
      });

      await sendNotification(req.user._id, {
        type: "order",
        title: "Order Confirmed",
        message: `Your order #${order.orderNumber} has been confirmed`,
        relatedOrder: order._id,
      });
    } catch (notifError) {
      console.log("Notification error (non-critical):", notifError.message);
    }

    try {
      await sendOrderConfirmationEmail(req.user._id, order);
    } catch (emailError) {
      console.log("Email error (non-critical):", emailError.message);
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed",
      order,
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Handle payment failure
// @route   POST /api/payment/failed
// @access  Private (Buyer only)
export const handlePaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, error } = req.body;

    console.log("❌ Payment Failed - User:", req.user._id);

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });

    if (payment) {
      payment.status = "failed";
      payment.failureReason = error?.description || "Payment failed";
      await payment.save();

      // Update order
      const order = await Order.findById(payment.order);
      if (order) {
        order.paymentStatus = "failed";
        order.statusHistory.push({
          status: "payment_failed",
          note: "Payment failed",
        });
        await order.save();
      }

      // Send notification
      try {
        await sendNotification(req.user._id, {
          type: "payment",
          title: "Payment Failed",
          message: "Your payment could not be processed. Please try again.",
          relatedOrder: order?._id,
        });
      } catch (notifError) {
        console.log("Notification error (non-critical):", notifError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment failure recorded",
    });
  } catch (error) {
    console.error("❌ Handle payment failure error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
