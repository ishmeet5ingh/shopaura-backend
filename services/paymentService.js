import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
export const createRazorpayOrder = async (amount, receipt) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new Error('Failed to create payment order');
  }
};

// Verify Razorpay payment signature
export const verifyRazorpayPayment = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
};

// Refund payment
export const refundPayment = async (paymentId, amount) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
      speed: 'normal'
    });
    return refund;
  } catch (error) {
    console.error('Refund error:', error);
    throw new Error('Failed to process refund');
  }
};

// Fetch payment details
export const fetchPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Fetch payment error:', error);
    throw new Error('Failed to fetch payment details');
  }
};
