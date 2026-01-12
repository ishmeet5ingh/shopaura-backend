// middleware/checkWishlistStatus.js
import productModel from '../models/ProductModel.js';
import Wishlist from '../models/WishlistModel.js';

export const checkWishlistStatus = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return next(); // Skip wishlist check for unauthenticated users
    }

    const { identifier } = req.params;
    
    // Find the product (same logic as controller)
    let productId;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      const product = await productModel.findById(identifier);
      if (product) productId = product._id;
    } else {
      const product = await productModel.findOne({ slug: identifier });
      if (product) productId = product._id;
    }

    if (!productId) {
      return next(); // Product not found, proceed without wishlist info
    }

    // Check if product is in user's wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const ishearted = wishlist?.products.some(
      item => item.product.toString() === productId.toString()
    ) || false;

    // Attach to request object
    req.ishearted = ishearted;
    req.productId = productId;

    next();
  } catch (error) {
    console.error('Wishlist status check error:', error);
    // On error, just proceed without wishlist info
    req.ishearted = false;
    next();
  }
};
