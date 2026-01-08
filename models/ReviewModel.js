import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: [{
    url: {
      type: String
    },
    public_id: {
      type: String
    }
  }],
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  helpfulCount: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false // Set to true if user purchased the product
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  response: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true }); // One review per user per product

// Method to mark review as helpful
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpful.includes(userId)) {
    this.helpful.push(userId);
    this.helpfulCount = this.helpful.length;
  }
};

// Method to unmark review as helpful
reviewSchema.methods.unmarkHelpful = function(userId) {
  this.helpful = this.helpful.filter(id => id.toString() !== userId.toString());
  this.helpfulCount = this.helpful.length;
};

// Static method to calculate product rating
reviewSchema.statics.calculateProductRating = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { 
        product: new mongoose.Types.ObjectId(productId),
        status: 'approved',
        isActive: true
      }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length > 0) {
    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    stats[0].ratingDistribution.forEach(rating => {
      distribution[rating]++;
    });

    await mongoose.model('Product').findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      numReviews: stats[0].numReviews,
      ratingDistribution: distribution
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      averageRating: 0,
      numReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
  }
};

// Update product rating after save
reviewSchema.post('save', function() {
  this.constructor.calculateProductRating(this.product);
});

// Update product rating after remove
reviewSchema.post('deleteOne', { document: true, query: false }, function() {
  this.constructor.calculateProductRating(this.product);
});

export default mongoose.model('Review', reviewSchema);
