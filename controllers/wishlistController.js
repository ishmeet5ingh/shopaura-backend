// controllers/wishlistController.js
import Wishlist from '../models/WishlistModel.js';
import Product from '../models/ProductModel.js';

// Helper: flatten wishlist to array of products for frontend
const mapWishlistToItems = (wishlist) => {
  if (!wishlist) return [];
  return wishlist.products
    .filter((p) => p.product)
    .map((p) => ({
      _id: p.product._id,
      slug: p.product.slug,
      name: p.product.name,
      price: p.product.price,
      finalPrice: p.product.finalPrice,
      discount: p.product.discount,
      thumbnail: p.product.thumbnail,
      images: p.product.images,
      stock: p.product.stock,
      isActive: p.product.isActive,
      averageRating: p.product.averageRating,
      reviewCount: p.product.reviewCount,
      addedAt: p.addedAt,
    }));
};

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
      path: 'products.product',
      select:
        'name slug price finalPrice discount thumbnail images stock isActive category averageRating reviewCount',
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Filter out inactive or missing products
    wishlist.products = wishlist.products.filter(
      (item) => item.product && item.product.isActive
    );
    await wishlist.save();

    const wishlistItems = mapWishlistToItems(wishlist);

    res.status(200).json({
      success: true,
      wishlistItems,
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist',
      error: error.message,
    });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/add
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available',
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const exists = wishlist.products.some(
      (item) => item.product.toString() === productId
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist',
      });
    }

    wishlist.products.push({
      product: productId,
      addedAt: new Date(),
    });

    await wishlist.save();

    wishlist = await Wishlist.findById(wishlist._id).populate({
      path: 'products.product',
      select:
        'name slug price finalPrice discount thumbnail images stock isActive category averageRating reviewCount',
    });

    const wishlistItems = mapWishlistToItems(wishlist);

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlistItems,
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
      error: error.message,
    });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    wishlist.products = wishlist.products.filter(
      (item) => item.product.toString() !== productId
    );

    await wishlist.save();

    wishlist = await Wishlist.findById(wishlist._id).populate({
      path: 'products.product',
      select:
        'name slug price finalPrice discount thumbnail images stock isActive category averageRating reviewCount',
    });

    const wishlistItems = mapWishlistToItems(wishlist);

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlistItems,
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
      error: error.message,
    });
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/wishlist/toggle
// @access  Private
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.findIndex(
      (item) => item.product.toString() === productId
    );

    let isAdded;
    let message;

    if (index > -1) {
      wishlist.products.splice(index, 1);
      isAdded = false;
      message = 'Product removed from wishlist';
    } else {
      wishlist.products.push({
        product: productId,
        addedAt: new Date(),
      });
      isAdded = true;
      message = 'Product added to wishlist';
    }

    await wishlist.save();

    wishlist = await Wishlist.findById(wishlist._id).populate({
      path: 'products.product',
      select:
        'name slug price finalPrice discount thumbnail images stock isActive category averageRating reviewCount',
    });

    const wishlistItems = mapWishlistToItems(wishlist);

    res.status(200).json({
      success: true,
      message,
      isAdded,
      wishlistItems,
    });
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle wishlist',
      error: error.message,
    });
  }
};

// @desc    Clear wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
export const clearWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      wishlistItems: [],
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist',
      error: error.message,
    });
  }
};

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
export const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        inWishlist: false,
      });
    }

    const inWishlist = wishlist.products.some(
      (item) => item.product.toString() === productId
    );

    res.status(200).json({
      success: true,
      inWishlist,
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist',
      error: error.message,
    });
  }
};
