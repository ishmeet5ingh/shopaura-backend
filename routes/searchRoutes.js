import express from 'express';
import {
  searchProducts,
  getAutocompleteSuggestions,
  getFilterOptions
} from '../controllers/searchController.js';

const router = express.Router();

// Public routes
router.get('/', searchProducts);
router.get('/autocomplete', getAutocompleteSuggestions);
router.get('/filters', getFilterOptions);

export default router;
