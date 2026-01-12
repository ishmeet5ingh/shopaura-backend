// models/Wishlist.js
import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalItems: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total items before saving
wishlistSchema.pre('save', function () {
  this.totalItems = this.products.length;
});

// Indexes
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'products.product': 1 });

export default mongoose.model('Wishlist', wishlistSchema);
