import nodemailer from 'nodemailer';
import User from '../models/UserModel.js';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email utility - EXPORT AS NAMED EXPORT
export const sendEmail = async (to, subject, html) => {
  try {
    // Skip if email not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('Email service not configured, skipping email to:', to);
      return;
    }

    const mailOptions = {
      from: `${process.env.COMPANY_NAME || 'ShopAura'} <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // Don't throw error, just log it so app continues working
  }
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (userId, order) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const subject = `Order Confirmation - #${order.orderNumber}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .total { font-size: 18px; font-weight: bold; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Thank you for your order! We're getting it ready for delivery.</p>
            
            <div class="order-details">
              <h3>Order #${order.orderNumber}</h3>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              <p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN')}</p>
              
              <h4>Items:</h4>
              ${order.items.map(item => `
                <div class="item">
                  <p><strong>${item.name}</strong></p>
                  <p>Quantity: ${item.quantity} × ₹${item.price} = ₹${item.quantity * item.price}</p>
                </div>
              `).join('')}
              
              <div class="total">
                <p>Subtotal: ₹${order.itemsPrice}</p>
                <p>Tax: ₹${order.taxPrice}</p>
                <p>Shipping: ₹${order.shippingPrice}</p>
                ${order.discountAmount > 0 ? `<p>Discount: -₹${order.discountAmount}</p>` : ''}
                <p style="color: #4F46E5;">Total: ₹${order.totalPrice}</p>
              </div>
              
              <h4>Shipping Address:</h4>
              <p>
                ${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.addressLine1}<br>
                ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
                ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                Phone: ${order.shippingAddress.phone}
              </p>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="button">Track Your Order</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'ShopAura'}. All rights reserved.</p>
            <p>${process.env.COMPANY_ADDRESS || ''}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Order confirmation email error:', error.message);
  }
};

// Send order status update email
export const sendOrderStatusEmail = async (userId, order, newStatus) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const statusMessages = {
      'confirmed': 'Your order has been confirmed',
      'processing': 'Your order is being processed',
      'shipped': 'Your order has been shipped',
      'out_for_delivery': 'Your order is out for delivery',
      'delivered': 'Your order has been delivered',
      'cancelled': 'Your order has been cancelled'
    };

    const subject = `Order ${statusMessages[newStatus]} - #${order.orderNumber}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .status-box { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; text-align: center; }
          .button { background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Update</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            
            <div class="status-box">
              <h2>${statusMessages[newStatus]}</h2>
              <p><strong>Order #${order.orderNumber}</strong></p>
              ${order.trackingNumber ? `<p>Tracking Number: ${order.trackingNumber}</p>` : ''}
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order._id}" class="button">View Order Details</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'ShopAura'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(user.email, subject, html);
  } catch (error) {
    console.error('❌ Order status email error:', error.message);
  }
};

// Send promotional email
export const sendPromotionalEmail = async (userId, title, message, link) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>${message}</p>
            ${link ? `<p style="text-align: center;"><a href="${link}" class="button">Shop Now</a></p>` : ''}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'ShopAura'}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(user.email, title, html);
  } catch (error) {
    console.error('❌ Promotional email error:', error.message);
  }
};

// Don't use default export
// export default sendEmail;  // REMOVE THIS LINE IF IT EXISTS
