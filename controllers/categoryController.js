import Category from '../models/CategoryModel.js';
import Product from '../models/ProductModel.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};

    // Active filter
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    } else {
      filter.isActive = true; // Default show only active
    }

    // Parent filter (get main categories or subcategories)
    if (req.query.parent) {
      filter.parent = req.query.parent === 'null' ? null : req.query.parent;
    }

    // Level filter
    if (req.query.level !== undefined) {
      filter.level = parseInt(req.query.level);
    }

    // Featured filter
    if (req.query.isFeatured === 'true') {
      filter.isFeatured = true;
    }

    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const categories = await Category.find(filter)
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 })
      .limit(limit)
      .skip(skip);

    const totalCategories = await Category.countDocuments(filter);
    const totalPages = Math.ceil(totalCategories / limit);

    res.status(200).json({
      success: true,
      count: categories.length,
      total: totalCategories,
      page,
      totalPages,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// @desc    Get category tree (hierarchical structure)
// @route   GET /api/categories/tree
// @access  Public
export const getCategoryTree = async (req, res) => {
  try {
    const tree = await Category.getCategoryTree();

    res.status(200).json({
      success: true,
      tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category tree',
      error: error.message
    });
  }
};

// @desc    Get single category by ID or slug
// @route   GET /api/categories/:identifier
// @access  Public
export const getCategoryByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is ObjectId or slug
    let category;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // It's an ObjectId
      category = await Category.findById(identifier)
        .populate('parent', 'name slug');
    } else {
      // It's a slug
      category = await Category.findOne({ slug: identifier })
        .populate('parent', 'name slug');
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get subcategories
    const subcategories = await Category.find({ 
      parent: category._id,
      isActive: true 
    }).sort({ order: 1, name: 1 });

    // Get category path
    const path = await category.getPath();

    res.status(200).json({
      success: true,
      category: {
        ...category.toObject(),
        subcategories,
        path
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin)
export const createCategory = async (req, res) => {
  try {
    const { name, description, parent, image, icon, order, isFeatured, meta } = req.body;

    // Calculate level based on parent
    let level = 0;
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      level = parentCategory.level + 1;
    }

    const category = await Category.create({
      name,
      description,
      parent: parent || null,
      level,
      image,
      icon,
      order,
      isFeatured,
      meta
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
export const updateCategory = async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If parent is being updated, recalculate level
    if (req.body.parent !== undefined) {
      if (req.body.parent) {
        const parentCategory = await Category.findById(req.body.parent);
        if (!parentCategory) {
          return res.status(404).json({
            success: false,
            message: 'Parent category not found'
          });
        }
        req.body.level = parentCategory.level + 1;
      } else {
        req.body.level = 0;
      }
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has subcategories
    const subcategoriesCount = await Category.countDocuments({ parent: category._id });
    if (subcategoriesCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete subcategories first.'
      });
    }

    // Check if category has products
    if (category.productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${category.productCount} products. Remove products first.`
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// @desc    Toggle category active status
// @route   PATCH /api/categories/:id/toggle-status
// @access  Private (Admin)
export const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling category status',
      error: error.message
    });
  }
};

// @desc    Get category with products
// @route   GET /api/categories/:id/products
// @access  Public
export const getCategoryWithProducts = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      category: category._id,
      isActive: true
    })
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalProducts = await Product.countDocuments({
      category: category._id,
      isActive: true
    });

    res.status(200).json({
      success: true,
      category,
      products: {
        count: products.length,
        total: totalProducts,
        page,
        totalPages: Math.ceil(totalProducts / limit),
        data: products
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category products',
      error: error.message
    });
  }
};

// @desc    Update category product count
// @route   PATCH /api/categories/:id/update-count
// @access  Private (Admin)
export const updateCategoryProductCount = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await category.updateProductCount();

    res.status(200).json({
      success: true,
      message: 'Product count updated',
      productCount: category.productCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product count',
      error: error.message
    });
  }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private (Admin)
export const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, order }

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Categories must be an array'
      });
    }

    const updatePromises = categories.map(cat =>
      Category.findByIdAndUpdate(cat.id, { order: cat.order })
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error reordering categories',
      error: error.message
    });
  }
};

// @desc    Get category statistics (Admin only)
// @route   GET /api/categories/admin/stats
// @access  Private (Admin)
export const getCategoryStats = async (req, res) => {
  try {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const mainCategories = await Category.countDocuments({ level: 0 });
    const subcategories = await Category.countDocuments({ level: { $gt: 0 } });

    // Top categories by product count
    const topCategories = await Category.find({ isActive: true })
      .sort({ productCount: -1 })
      .limit(10)
      .select('name productCount');

    res.status(200).json({
      success: true,
      stats: {
        total: totalCategories,
        active: activeCategories,
        inactive: totalCategories - activeCategories,
        mainCategories,
        subcategories
      },
      topCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category statistics',
      error: error.message
    });
  }
};
