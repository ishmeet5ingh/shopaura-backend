import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // Step 1: Drop all indexes
    console.log('🗑️  Dropping all product indexes...');
    await productsCollection.dropIndexes();
    console.log('✅ All indexes dropped\n');

    // Step 2: Delete all products
    console.log('🗑️  Deleting all existing products...');
    const result = await productsCollection.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} products\n`);

    console.log('✅ Database cleaned! Now run: node seedProducts.js\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixIndexes();
