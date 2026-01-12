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
import { uploadProductImages } from '../middleware/multerConfig.js';
import { checkWishlistStatus } from '../middleware/checkWishlistStatus.js';

const router = express.Router();

// ✅ IMPORTANT: Specific routes MUST come BEFORE dynamic routes

// Public routes
router.get('/', getAllProducts);

// Protected routes - BEFORE /:identifier
router.get('/my/products', protect, restrictTo('seller', 'admin'), getMyProducts);

// ✅ CHANGED: Allow both seller and admin to access stats
router.get('/my/stats', protect, restrictTo('seller', 'admin'), getProductStats);

// Admin only routes - BEFORE /:identifier
router.get('/admin/stats', protect, restrictTo('admin'), getProductStats);

// Seller routes - BEFORE /:identifier
router.get('/seller/:sellerId', getProductsBySeller);

// Product management - BEFORE /:identifier
router.post(
  '/',
  protect,
  restrictTo('seller', 'admin'),
  uploadProductImages.fields([
    { name: 'images', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  createProduct
);

router.put(
  '/:id',
  protect,
  restrictTo('seller', 'admin'),
  uploadProductImages.fields([
    { name: 'images', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  updateProduct
);

router.delete('/:id', protect, restrictTo('seller', 'admin'), deleteProduct);
router.patch('/:id/toggle-status', protect, restrictTo('seller', 'admin'), toggleProductStatus);

// ✅ Dynamic route MUST be LAST
// Apply middleware conditionally - only check wishlist if authenticated
router.get('/:identifier', protect, checkWishlistStatus, getProductByIdentifier);

// For unauthenticated users, use this route (no wishlist check)
router.get('/:identifier/public', getProductByIdentifier);

export default router;
