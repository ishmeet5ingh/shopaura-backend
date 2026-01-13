import express from 'express';
import {
  getAddresses,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/addressController.js';
import { protect } from '../middleware/authMiddleware.js';
import { buyerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and buyer role
router.use(protect, buyerOnly);

router.route('/')
  .get(getAddresses)
  .post(addAddress);

router.route('/:id')
  .get(getAddress)
  .put(updateAddress)
  .delete(deleteAddress);

router.put('/:id/default', setDefaultAddress);

export default router;
