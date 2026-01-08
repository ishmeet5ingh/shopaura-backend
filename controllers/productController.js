import Product from '../models/ProductModel.js';
import Category from '../models/CategoryModel.js';
import mongoose from 'mongoose';

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isActive: true };

    // Search query
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Subcategory filter
    if (req.query.subcategory) {
      filter.subcategory = req.query.subcategory;
    }

    // Brand filter
    if (req.query.brand) {
      filter.brand = req.query.brand;
    }

    // Seller filter
    if (req.query.seller) {
      filter.seller = req.query.seller;
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Rating filter
    if (req.query.minRating) {
      filter.averageRating = { $gte: parseFloat(req.query.minRating) };
    }

    // In stock filter
    if (req.query.inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    // Featured filter
    if (req.query.isFeatured === 'true') {
      filter.isFeatured = true;
    }

    // Sort options
    let sort = {};
    switch (req.query.sort) {
      case 'price_asc':
        sort.price = 1;
        break;
      case 'price_desc':
        sort.price = -1;
        break;
      case 'rating':
        sort.averageRating = -1;
        break;
      case 'popular':
        sort.soldCount = -1;
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      case 'oldest':
        sort.createdAt = 1;
        break;
      default:
        sort.createdAt = -1;
    }

    // Execute query
    const products = await Product.find(filter)
      .populate('seller', 'name email')
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean();

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      page,
      totalPages,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product by ID or slug
// @route   GET /api/products/:identifier
// @access  Public
export const getProductByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    let product;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(identifier);
    } else {
      product = await Product.findOne({ slug: identifier });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Populate references
    await product.populate([
      { path: 'seller', select: 'name email avatar' },
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' }
    ]);

    // Increment views
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Seller, Admin)
export const createProduct = async (req, res) => {
  try {
    // Add seller ID from authenticated user
    req.body.seller = req.user._id;

    // Verify category exists
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Verify subcategory exists if provided
    if (req.body.subcategory) {
      const subcategoryExists = await Category.findById(req.body.subcategory);
      if (!subcategoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }
    }

    const product = await Product.create(req.body);
    await product.populate([
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller-own products, Admin-all products)
export const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Prevent seller field update
    delete req.body.seller;

    // Verify category if being updated
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller-own products, Admin-all products)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// @desc    Get products by seller
// @route   GET /api/products/seller/:sellerId
// @access  Public
export const getProductsBySeller = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const products = await Product.find({ 
      seller: req.params.sellerId,
      isActive: true 
    })
      .populate('seller', 'name email')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalProducts = await Product.countDocuments({ 
      seller: req.params.sellerId,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching seller products',
      error: error.message
    });
  }
};

// @desc    Get seller's own products
// @route   GET /api/products/my-products
// @access  Private (Seller, Admin)
export const getMyProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { seller: req.user._id };

    if (req.query.includeInactive !== 'true') {
      filter.isActive = true;
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your products',
      error: error.message
    });
  }
};

// @desc    Get product statistics (Admin only)
// @route   GET /api/products/admin/stats
// @access  Private (Admin)
export const getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
          averagePrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
          totalSold: { $sum: '$soldCount' }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryInfo.name' },
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {},
      categoryStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};

// @desc    Toggle product active status
// @route   PATCH /api/products/:id/toggle-status
// @access  Private (Seller-own products, Admin-all products)
export const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling product status',
      error: error.message
    });
  }
};
