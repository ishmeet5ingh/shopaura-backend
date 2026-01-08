import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0 // 0 for main category, 1 for subcategory, 2 for sub-subcategory
  },
  image: {
    url: {
      type: String,
      default: 'https://via.placeholder.com/200'
    },
    public_id: {
      type: String
    }
  },
  icon: {
    type: String, // Icon class or URL
    default: ''
  },
  order: {
    type: Number,
    default: 0 // For sorting categories
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  productCount: {
    type: Number,
    default: 0
  },
  meta: {
    title: String,
    description: String,
    keywords: [String]
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ name: 'text', description: 'text' });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Generate slug from name before saving
categorySchema.pre('save', function() {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

// Method to get full category path
categorySchema.methods.getPath = async function() {
  const path = [this.name];
  let current = this;
  
  while (current.parent) {
    current = await this.model('Category').findById(current.parent);
    if (current) {
      path.unshift(current.name);
    } else {
      break;
    }
  }
  
  return path.join(' > ');
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function(parentId = null, level = 0) {
  const categories = await this.find({ 
    parent: parentId,
    isActive: true 
  }).sort({ order: 1, name: 1 });

  const tree = [];
  
  for (const category of categories) {
    const subcategories = await this.getCategoryTree(category._id, level + 1);
    tree.push({
      ...category.toObject(),
      subcategories: subcategories.length > 0 ? subcategories : undefined
    });
  }
  
  return tree;
};

// Update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ 
    category: this._id,
    isActive: true 
  });
  this.productCount = count;
  await this.save();
};

export default mongoose.model('Category', categorySchema);
