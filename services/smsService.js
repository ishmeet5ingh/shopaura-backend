import twilio from 'twilio';

// Initialize Twilio client only if credentials are provided
let client = null;

if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio SMS service initialized');
  } catch (error) {
    console.warn('⚠️  Twilio initialization failed:', error.message);
  }
} else {
  console.log('ℹ️  Twilio SMS service not configured (optional feature)');
}

// Send SMS utility
export const sendSMS = async (to, message) => {
  try {
    // Skip if Twilio not configured
    if (!client) {
      console.log('📱 SMS not sent (Twilio not configured):', message.substring(0, 50) + '...');
      return;
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.log('📱 SMS not sent (Twilio phone number not configured)');
      return;
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log(`✅ SMS sent to ${to}`);
  } catch (error) {
    console.error('❌ SMS send error:', error.message);
    // Don't throw - just log the error
  }
};

// Send order confirmation SMS
export const sendOrderConfirmationSMS = async (phone, orderNumber) => {
  const message = `Your order #${orderNumber} has been confirmed! Track your order at ${process.env.FRONTEND_URL || 'our website'}. - ${process.env.COMPANY_NAME || 'ShopAura'}`;
  await sendSMS(phone, message);
};

// Send order status SMS
export const sendOrderStatusSMS = async (phone, orderNumber, status) => {
  const statusMessages = {
    'shipped': 'shipped',
    'out_for_delivery': 'out for delivery',
    'delivered': 'delivered'
  };

  const message = `Your order #${orderNumber} is ${statusMessages[status]}. Track at ${process.env.FRONTEND_URL || 'our website'}. - ${process.env.COMPANY_NAME || 'ShopAura'}`;
  await sendSMS(phone, message);
};

// Send OTP
export const sendOTP = async (phone, otp) => {
  const message = `Your OTP for ${process.env.COMPANY_NAME || 'ShopAura'} is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
  await sendSMS(phone, message);
};
