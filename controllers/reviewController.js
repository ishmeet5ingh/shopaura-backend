import Review from '../models/ReviewModel.js';
import Product from '../models/ProductModel.js';
import mongoose from 'mongoose';

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      product: req.params.productId,
      status: 'approved',
      isActive: true
    };

    // Rating filter
    if (req.query.rating) {
      filter.rating = parseInt(req.query.rating);
    }

    // Verified purchase filter
    if (req.query.verified === 'true') {
      filter.verified = true;
    }

    // Sort options
    let sort = {};
    switch (req.query.sort) {
      case 'helpful':
        sort.helpfulCount = -1;
        break;
      case 'rating_high':
        sort.rating = -1;
        break;
      case 'rating_low':
        sort.rating = 1;
        break;
      case 'oldest':
        sort.createdAt = 1;
        break;
      case 'newest':
      default:
        sort.createdAt = -1;
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name avatar')
      .populate('response.respondedBy', 'name role')
      .sort(sort)
      .limit(limit)
      .skip(skip);

    const totalReviews = await Review.countDocuments(filter);
    const totalPages = Math.ceil(totalReviews / limit);

    // Get rating summary
    const ratingSummary = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(req.params.productId),
          status: 'approved',
          isActive: true
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total: totalReviews,
      page,
      totalPages,
      ratingSummary,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Public
export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('product', 'name thumbnail price')
      .populate('response.respondedBy', 'name role');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
};

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private (Authenticated users)
export const createReview = async (req, res) => {
  try {
    const { product, rating, title, comment, images } = req.body;

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product,
      user: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create review
    const review = await Review.create({
      product,
      user: req.user._id,
      rating,
      title,
      comment,
      images: images || [],
      verified: false // Set based on order history in production
    });

    await review.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Review owner)
export const updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    const { rating, title, comment, images } = req.body;

    review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, title, comment, images },
      { new: true, runValidators: true }
    ).populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Review owner, Admin)
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
export const markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if already marked helpful
    if (review.helpful.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this review as helpful'
      });
    }

    review.markHelpful(req.user._id);
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};

// @desc    Unmark review as helpful
// @route   DELETE /api/reviews/:id/helpful
// @access  Private
export const unmarkReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.unmarkHelpful(req.user._id);
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review unmarked as helpful',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unmarking review',
      error: error.message
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getMyReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name thumbnail price')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalReviews = await Review.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total: totalReviews,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your reviews',
      error: error.message
    });
  }
};

// @desc    Add seller/admin response to review
// @route   POST /api/reviews/:id/response
// @access  Private (Seller-own products, Admin)
export const addReviewResponse = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('product');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check authorization (seller of the product or admin)
    if (
      req.user.role !== 'admin' &&
      review.product.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this review'
      });
    }

    review.response = {
      message: req.body.message,
      respondedBy: req.user._id,
      respondedAt: Date.now()
    };

    await review.save();
    await review.populate('response.respondedBy', 'name role');

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding response',
      error: error.message
    });
  }
};

// @desc    Update review status (Admin only)
// @route   PATCH /api/reviews/:id/status
// @access  Private (Admin)
export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review status updated',
      review
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating review status',
      error: error.message
    });
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews/admin/all
// @access  Private (Admin)
export const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Rating filter
    if (req.query.rating) {
      filter.rating = parseInt(req.query.rating);
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name email avatar')
      .populate('product', 'name thumbnail seller')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalReviews = await Review.countDocuments(filter);
    const totalPages = Math.ceil(totalReviews / limit);

    // Get review statistics
    const stats = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total: totalReviews,
      page,
      totalPages,
      stats,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};
