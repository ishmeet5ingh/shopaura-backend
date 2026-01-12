import Product from '../models/ProductModel.js';
import Category from '../models/CategoryModel.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // ✅ FIX: Handle category by slug or ObjectId
    if (req.query.category) {
      // Check if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(req.query.category) && req.query.category.length === 24) {
        filter.category = req.query.category;
      } else {
        // It's a slug, find the category first
        const category = await Category.findOne({ slug: req.query.category });
        if (category) {
          filter.category = category._id;
        } else {
          // Category not found, return empty results
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            page,
            totalPages: 0,
            products: []
          });
        }
      }
    }

    // ✅ FIX: Handle subcategory by slug or ObjectId
    if (req.query.subcategory) {
      if (mongoose.Types.ObjectId.isValid(req.query.subcategory) && req.query.subcategory.length === 24) {
        filter.subcategory = req.query.subcategory;
      } else {
        const subcategory = await Category.findOne({ slug: req.query.subcategory });
        if (subcategory) {
          filter.subcategory = subcategory._id;
        }
      }
    }

    if (req.query.brand) {
      filter.brand = req.query.brand;
    }

    if (req.query.seller) {
      filter.seller = req.query.seller;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    if (req.query.minRating) {
      filter.averageRating = { $gte: parseFloat(req.query.minRating) };
    }

    if (req.query.inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    if (req.query.isFeatured === 'true') {
      filter.isFeatured = true;
    }

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
    console.error('Error in getAllProducts:', error);
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

    // Populate product relationships
    await product.populate([
      { path: 'seller', select: 'name email avatar' },
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' }
    ]);

    // Increment views using atomic update (better performance) [web:12][web:15]
    await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } });

    // Prepare response
    const responseData = product.toJSON();

    // Add ishearted field ONLY for authenticated users
    if (req.user && req.ishearted !== undefined) {
      responseData.ishearted = req.ishearted;
    }

    res.status(200).json({
      success: true,
      product: responseData
    });
  } catch (error) {
    console.error('Error in getProductByIdentifier:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Create new product with images
// @route   POST /api/products
// @access  Private (Seller, Admin)
export const createProduct = async (req, res) => {
  try {
    // Parse JSON data from request body
    const productData = JSON.parse(req.body.data);
    
    // Add seller ID from authenticated user
    productData.seller = req.user._id;

    // Verify category exists
    if (productData.category) {
      const categoryExists = await Category.findById(productData.category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Verify subcategory exists if provided
    if (productData.subcategory) {
      const subcategoryExists = await Category.findById(productData.subcategory);
      if (!subcategoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }
    }

    // Handle uploaded images
    const images = [];
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        images.push({
          url: file.path,
          public_id: file.filename,
          alt: productData.name
        });
      }
    }

    // Handle thumbnail
    let thumbnail = {
      url: 'https://placehold.co/300x300?text=Product',
      public_id: null
    };
    
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      thumbnail = {
        url: req.files.thumbnail[0].path,
        public_id: req.files.thumbnail[0].filename
      };
    } else if (images.length > 0) {
      // Use first image as thumbnail if not provided
      thumbnail = {
        url: images[0].url,
        public_id: images[0].public_id
      };
    }

    // Create product with uploaded images
    const product = await Product.create({
      ...productData,
      images,
      thumbnail
    });

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
    console.error('Error in createProduct:', error);
    // If error occurs, delete uploaded images from Cloudinary
    if (req.files) {
      const allFiles = [
        ...(req.files.images || []),
        ...(req.files.thumbnail || [])
      ];
      
      for (const file of allFiles) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    }

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

    // Check if req.body.data exists
    if (!req.body.data) {
      return res.status(400).json({
        success: false,
        message: 'No product data provided. Send data in "data" field as JSON string.'
      });
    }

    // Parse JSON data
    let productData;
    try {
      productData = JSON.parse(req.body.data);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in data field',
        error: error.message
      });
    }

    // Prevent seller field update
    delete productData.seller;

    // Verify category if being updated
    if (productData.category) {
      const categoryExists = await Category.findById(productData.category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Handle new uploaded images
    if (req.files && req.files.images) {
      const newImages = [];
      for (const file of req.files.images) {
        newImages.push({
          url: file.path,
          public_id: file.filename,
          alt: productData.name || product.name
        });
      }
      
      // Merge with existing images if keepExistingImages is true
      if (productData.keepExistingImages && productData.existingImages) {
        productData.images = [...productData.existingImages, ...newImages];
      } else {
        // Delete old images from Cloudinary
        for (const image of product.images) {
          if (image.public_id) {
            try {
              await cloudinary.uploader.destroy(image.public_id);
            } catch (err) {
              console.error('Error deleting old image:', err);
            }
          }
        }
        productData.images = newImages;
      }
    } else if (productData.existingImages) {
      // Keep existing images if no new images uploaded
      productData.images = productData.existingImages;
    }

    // Handle thumbnail update
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      // Delete old thumbnail if exists
      if (product.thumbnail && product.thumbnail.public_id) {
        const isProductImage = product.images.some(img => img.public_id === product.thumbnail.public_id);
        if (!isProductImage) {
          try {
            await cloudinary.uploader.destroy(product.thumbnail.public_id);
          } catch (err) {
            console.error('Error deleting old thumbnail:', err);
          }
        }
      }

      productData.thumbnail = {
        url: req.files.thumbnail[0].path,
        public_id: req.files.thumbnail[0].filename,
        alt: productData.name || product.name
      };
    } else if (productData.existingThumbnail) {
      productData.thumbnail = productData.existingThumbnail;
    } else if (productData.images && productData.images.length > 0) {
      productData.thumbnail = {
        url: productData.images[0].url,
        public_id: productData.images[0].public_id,
        alt: productData.images[0].alt
      };
    }

    // Clean up fields
    delete productData.keepExistingImages;
    delete productData.existingImages;
    delete productData.existingThumbnail;

    product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'category', select: 'name slug' },
      { path: 'subcategory', select: 'name slug' },
      { path: 'seller', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    // Delete newly uploaded images on error
    if (req.files) {
      const allFiles = [
        ...(req.files.images || []),
        ...(req.files.thumbnail || [])
      ];
      
      for (const file of allFiles) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    }

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
    console.error('Error in deleteProduct:', error);
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
    console.error('Error in getProductsBySeller:', error);
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
    console.error('Error in getMyProducts:', error);
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
// @desc    Get product statistics (Seller sees own, Admin sees all)
// @route   GET /api/products/my/stats
// @access  Private (Seller, Admin)
export const getProductStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // ✅ FIXED: Filter by seller for non-admin users
    const matchQuery = isAdmin ? {} : { seller: userId };

    console.log('===== STATS DEBUG =====');
    console.log('User ID:', userId);
    console.log('User Role:', req.user.role);
    console.log('Match Query:', matchQuery);

    // Get overall statistics
    const stats = await Product.aggregate([
      { $match: matchQuery }, // ← Add seller filter
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactiveProducts: { $sum: { $cond: ['$isActive', 0, 1] } },
          averagePrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
          totalSold: { $sum: '$soldCount' },
          lowStockCount: { 
            $sum: { 
              $cond: [
                { $and: [{ $gt: ['$stock', 0] }, { $lt: ['$stock', 10] }] },
                1,
                0
              ]
            }
          },
          outOfStockCount: { 
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
          }
        }
      }
    ]);

    console.log('Stats Result:', stats);

    // Get category-wise statistics
    const categoryStats = await Product.aggregate([
      { $match: matchQuery }, // ← Add seller filter
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryInfo.name' },
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: { $ifNull: ['$name', 'Uncategorized'] },
          count: 1,
          averagePrice: { $round: ['$averagePrice', 2] },
          totalStock: 1
        }
      }
    ]);

    console.log('Category Stats:', categoryStats);
    console.log('=======================');

    const statsData = stats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      averagePrice: 0,
      totalStock: 0,
      totalSold: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    };

    res.status(200).json({
      success: true,
      stats: statsData,
      categoryStats
    });
  } catch (error) {
    console.error('Error in getProductStats:', error);
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
    console.error('Error in toggleProductStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling product status',
      error: error.message
    });
  }
};
