import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
discountPrice: {
  type: Number,
  min: [0, 'Discount price cannot be negative'],
  validate: {
    validator: function (value) {
      // Allow empty discount price
      if (value == null) return true;

      // On update, price may not be in this doc
      const price = this.price ?? this.get('price');

      // If price is missing, skip validation
      if (price == null) return true;

      return value < price;
    },
    message: 'Discount price must be less than regular price'
  }
},
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    },
    alt: String
  }],
  thumbnail: {
    url: {
      type: String,
      default: 'https://via.placeholder.com/300'
    },
    public_id: String
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller information is required']
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  numReviews: {
    type: Number,
    default: 0
  },
  ratingDistribution: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'g', 'lb', 'oz']
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inch', 'm']
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });

// Virtual for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product'
});

// Virtual for final price
productSchema.virtual('finalPrice').get(function() {
  return this.discountPrice || this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.discountPrice && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Generate slug from name before saving
productSchema.pre('save', function() {
  if (this.isModified('name') && !this.slug) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Add random suffix to make slug unique
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    this.slug = `${baseSlug}-${randomSuffix}`;
  }
});

// Update category product count after save
productSchema.post('save', async function() {
  if (this.category) {
    const Category = mongoose.model('Category');
    const category = await Category.findById(this.category);
    if (category) {
      await category.updateProductCount();
    }
  }
});

// Delete images from Cloudinary when product is deleted
productSchema.pre('deleteOne', { document: true, query: false }, async function() {
  try {
    const cloudinary = (await import('../config/cloudinary.js')).default;
    
    // Delete all product images
    if (this.images && this.images.length > 0) {
      for (const image of this.images) {
        if (image.public_id) {
          await cloudinary.uploader.destroy(image.public_id);
        }
      }
    }
    
    // Delete thumbnail
    if (this.thumbnail && this.thumbnail.public_id) {
      await cloudinary.uploader.destroy(this.thumbnail.public_id);
    }
  } catch (error) {
    console.error('Error deleting images from Cloudinary:', error);
  }
});

// Update category product count after delete
productSchema.post('deleteOne', { document: true, query: false }, async function() {
  if (this.category) {
    const Category = mongoose.model('Category');
    const category = await Category.findById(this.category);
    if (category) {
      await category.updateProductCount();
    }
  }
});

export default mongoose.model('Product', productSchema);
