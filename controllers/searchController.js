import Product from '../models/ProductModel.js';
import Category from '../models/CategoryModel.js';

// @desc    Search products with filters
// @route   GET /api/search
// @access  Public
export const searchProducts = async (req, res) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      minRating,
      brand,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = { isActive: true };

    // Search by keyword
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by rating
    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    // Filter by brand
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { averageRating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'popularity':
        sortOption = { reviewCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Execute query
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get autocomplete suggestions
// @route   GET /api/search/autocomplete
// @access  Public
export const getAutocompleteSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = await Product.find({
      name: { $regex: q, $options: 'i' },
      isActive: true
    })
      .select('name')
      .limit(10);

    res.status(200).json({
      success: true,
      suggestions: suggestions.map(p => p.name)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get filter options (brands, price range, etc.)
// @route   GET /api/search/filters
// @access  Public
export const getFilterOptions = async (req, res) => {
  try {
    const { category } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;

    // Get unique brands
    const brands = await Product.distinct('brand', query);

    // Get price range
    const priceRange = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    // Get categories
    const categories = await Category.find({ isActive: true })
      .select('name slug icon');

    res.status(200).json({
      success: true,
      filters: {
        brands: brands.filter(b => b),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
        categories,
        ratings: [5, 4, 3, 2, 1]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
