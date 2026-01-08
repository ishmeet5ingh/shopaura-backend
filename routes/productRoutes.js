import express from 'express';
import {
  getAllProducts,
  getProductByIdentifier,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsBySeller,
  getMyProducts,
  getProductStats,
  toggleProductStatus
} from '../controllers/productController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/seller/:sellerId', getProductsBySeller);
router.get('/:identifier', getProductByIdentifier);

// Protected routes - Seller and Admin can create products
router.post('/', protect, restrictTo('seller', 'admin'), createProduct);

// Seller's own products
router.get('/my/products', protect, restrictTo('seller', 'admin'), getMyProducts);

// Product management (Seller for own products, Admin for all)
router.put('/:id', protect, restrictTo('seller', 'admin'), updateProduct);
router.delete('/:id', protect, restrictTo('seller', 'admin'), deleteProduct);
router.patch('/:id/toggle-status', protect, restrictTo('seller', 'admin'), toggleProductStatus);

// Admin only routes
router.get('/admin/stats', protect, restrictTo('admin'), getProductStats);

export default router;
