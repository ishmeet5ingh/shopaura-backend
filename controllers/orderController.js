// backend/controllers/orderController.js
import Order from '../models/OrderModel.js';
import Product from '../models/ProductModel.js';
import { sendNotification } from '../services/notificationService.js';
import { generateInvoicePDF } from '../services/invoiceService.js';


// @desc    Get all orders for logged-in user
// @route   GET /api/orders
// @access  Private (Buyer only)
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name slug price finalPrice discount images stock isActive'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (Buyer only)
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    })
    .populate({  // ✅ ADDED POPULATE
      path: 'items.product',
      select: 'name slug price finalPrice discount images stock isActive'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Buyer only)
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow cancellation for pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: req.body.reason || 'Cancelled by customer'
    });

    await order.save();

    // Send notification (wrapped in try-catch)
    try {
      await sendNotification(req.user._id, {
        type: 'order',
        title: 'Order Cancelled',
        message: `Your order #${order.orderNumber} has been cancelled`,
        relatedOrder: order._id
      });
    } catch (notifError) {
      console.log('Notification error (non-critical):', notifError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Download invoice
// @route   GET /api/orders/:id/invoice
// @access  Private (Buyer only)
export const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('user');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is delivered (invoices usually only for delivered orders)
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is only available for delivered orders'
      });
    }

    // Generate PDF invoice
    try {
      const pdfBuffer = await generateInvoicePDF(order);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      
      // Fallback: Return JSON invoice data if PDF generation fails
      res.status(200).json({
        success: true,
        message: 'PDF generation not available, returning invoice data',
        invoice: {
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          items: order.items,
          subtotal: order.itemsPrice,
          tax: order.taxPrice,
          shipping: order.shippingPrice,
          discount: order.discountAmount,
          total: order.totalPrice,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus
        }
      });
    }
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Track order
// @route   GET /api/orders/:id/track
// @access  Private (Buyer only)
export const trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).select('orderNumber orderStatus statusHistory trackingNumber estimatedDeliveryDate deliveredAt');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      tracking: {
        orderNumber: order.orderNumber,
        currentStatus: order.orderStatus,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDeliveryDate,
        deliveredAt: order.deliveredAt,
        history: order.statusHistory
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
