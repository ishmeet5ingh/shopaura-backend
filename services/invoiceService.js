import PDFDocument from 'pdfkit';
import User from '../models/UserModel.js';

// Generate invoice PDF
export const generateInvoicePDF = async (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Get user
      const user = await User.findById(order.user);

      // Header
      doc.fontSize(20).text(process.env.COMPANY_NAME, 50, 50);
      doc.fontSize(10).text(process.env.COMPANY_ADDRESS, 50, 75);
      doc.text(`Email: ${process.env.COMPANY_EMAIL}`, 50, 90);
      doc.text(`Phone: ${process.env.COMPANY_PHONE}`, 50, 105);

      // Invoice title
      doc.fontSize(20).text('INVOICE', 400, 50);
      doc.fontSize(10).text(`Invoice #: ${order.orderNumber}`, 400, 75);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 90);

      // Line
      doc.moveTo(50, 130).lineTo(550, 130).stroke();

      // Customer details
      doc.fontSize(12).text('Bill To:', 50, 150);
      doc.fontSize(10)
        .text(user.name, 50, 170)
        .text(order.shippingAddress.addressLine1, 50, 185)
        .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`, 50, 200)
        .text(`Phone: ${order.shippingAddress.phone}`, 50, 215);

      // Order details
      doc.fontSize(12).text('Order Details:', 50, 250);

      // Table header
      const tableTop = 280;
      doc.fontSize(10)
        .text('Item', 50, tableTop)
        .text('Qty', 300, tableTop)
        .text('Price', 370, tableTop)
        .text('Total', 470, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table rows
      let yPosition = tableTop + 25;
      order.items.forEach(item => {
        doc.text(item.name, 50, yPosition)
          .text(item.quantity.toString(), 300, yPosition)
          .text(`₹${item.price}`, 370, yPosition)
          .text(`₹${(item.quantity * item.price).toFixed(2)}`, 470, yPosition);
        yPosition += 20;
      });

      // Line
      doc.moveTo(50, yPosition + 10).lineTo(550, yPosition + 10).stroke();

      // Totals
      yPosition += 25;
      doc.text('Subtotal:', 370, yPosition)
        .text(`₹${order.itemsPrice.toFixed(2)}`, 470, yPosition);

      yPosition += 20;
      if (order.discountAmount > 0) {
        doc.text('Discount:', 370, yPosition)
          .text(`-₹${order.discountAmount.toFixed(2)}`, 470, yPosition);
        yPosition += 20;
      }

      doc.text('Tax (GST):', 370, yPosition)
        .text(`₹${order.taxPrice.toFixed(2)}`, 470, yPosition);

      yPosition += 20;
      doc.text('Shipping:', 370, yPosition)
        .text(`₹${order.shippingPrice.toFixed(2)}`, 470, yPosition);

      yPosition += 20;
      doc.fontSize(12)
        .text('Total:', 370, yPosition)
        .text(`₹${order.totalPrice.toFixed(2)}`, 470, yPosition);

      // Footer
      doc.fontSize(8)
        .text('Thank you for shopping with us!', 50, 700, { align: 'center' })
        .text(`This is a computer-generated invoice and does not require a signature.`, 50, 715, { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      reject(error);
    }
  });
};
