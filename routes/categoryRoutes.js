import express from 'express';
import {
  getAllCategories,
  getCategoryTree,
  getCategoryByIdentifier,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryWithProducts,
  getCategoryWithProductsByIdentifier, // NEW
  updateCategoryProductCount,
  reorderCategories,
  getCategoryStats
} from '../controllers/categoryController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { uploadCategoryImage } from '../middleware/multerConfig.js';

const router = express.Router();

// Public routes
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree);

// NEW: products by identifier (id or slug) – placed BEFORE generic :identifier route
router.get('/:identifier/products', getCategoryWithProductsByIdentifier);

router.get('/:identifier', getCategoryByIdentifier);

// existing id-based products route kept intact
router.get('/:id/products', getCategoryWithProducts);

// Admin only routes
router.post(
  '/',
  protect,
  restrictTo('admin'),
  uploadCategoryImage.single('image'),
  createCategory
);
router.put(
  '/:id',
  protect,
  restrictTo('admin'),
  uploadCategoryImage.single('image'),
  updateCategory
);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);
router.patch('/:id/toggle-status', protect, restrictTo('admin'), toggleCategoryStatus);
router.patch('/:id/update-count', protect, restrictTo('admin'), updateCategoryProductCount);
router.put('/reorder', protect, restrictTo('admin'), reorderCategories);
router.get('/admin/stats', protect, restrictTo('admin'), getCategoryStats);

export default router;
