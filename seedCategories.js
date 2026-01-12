
import mongoose from 'mongoose';
import Category from './models/CategoryModel.js'
import dotenv from 'dotenv';

dotenv.config();

// Categories data
const categoriesData = [
  {
    "name": "Electronics",
    "description": "Electronic devices and gadgets",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400"
    },
    "order": 1,
    "isFeatured": true
  },
  {
    "name": "Smartphones",
    "description": "Mobile phones and accessories",
    "parent": "Electronics",
    "image": {
      "url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"
    },
    "order": 1,
    "isFeatured": true
  },
  {
    "name": "Laptops",
    "description": "Notebooks and portable computers",
    "parent": "Electronics",
    "image": {
      "url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"
    },
    "order": 2,
    "isFeatured": true
  },
  {
    "name": "Fashion",
    "description": "Clothing, footwear and accessories",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400"
    },
    "order": 2,
    "isFeatured": true
  },
  {
    "name": "Men's Clothing",
    "description": "Shirts, pants, and men's wear",
    "parent": "Fashion",
    "image": {
      "url": "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400"
    },
    "order": 1,
    "isFeatured": false
  },
  {
    "name": "Women's Clothing",
    "description": "Dresses, tops, and women's wear",
    "parent": "Fashion",
    "image": {
      "url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400"
    },
    "order": 2,
    "isFeatured": true
  },
  {
    "name": "Home & Kitchen",
    "description": "Home appliances and kitchenware",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400"
    },
    "order": 3,
    "isFeatured": false
  },
  {
    "name": "Kitchen Appliances",
    "description": "Blenders, mixers, and cooking tools",
    "parent": "Home & Kitchen",
    "image": {
      "url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"
    },
    "order": 1,
    "isFeatured": false
  },
  {
    "name": "Home Decor",
    "description": "Decorative items and furnishings",
    "parent": "Home & Kitchen",
    "image": {
      "url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400"
    },
    "order": 2,
    "isFeatured": false
  },
  {
    "name": "Sports & Fitness",
    "description": "Sports equipment and fitness gear",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400"
    },
    "order": 4,
    "isFeatured": false
  },
  {
    "name": "Gym Equipment",
    "description": "Weights, machines, and workout gear",
    "parent": "Sports & Fitness",
    "image": {
      "url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400"
    },
    "order": 1,
    "isFeatured": false
  },
  {
    "name": "Outdoor Sports",
    "description": "Camping, hiking, and outdoor gear",
    "parent": "Sports & Fitness",
    "image": {
      "url": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400"
    },
    "order": 2,
    "isFeatured": false
  },
  {
    "name": "Books & Stationery",
    "description": "Books, notebooks, and office supplies",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400"
    },
    "order": 5,
    "isFeatured": false
  },
  {
    "name": "Fiction Books",
    "description": "Novels, stories, and fiction literature",
    "parent": "Books & Stationery",
    "image": {
      "url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400"
    },
    "order": 1,
    "isFeatured": false
  },
  {
    "name": "Office Supplies",
    "description": "Pens, papers, and office essentials",
    "parent": "Books & Stationery",
    "image": {
      "url": "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400"
    },
    "order": 2,
    "isFeatured": false
  },
  {
    "name": "Beauty & Personal Care",
    "description": "Cosmetics, skincare, and personal care products",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400"
    },
    "order": 6,
    "isFeatured": true
  },
  {
    "name": "Skincare",
    "description": "Creams, serums, and skincare products",
    "parent": "Beauty & Personal Care",
    "image": {
      "url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400"
    },
    "order": 1,
    "isFeatured": true
  },
  {
    "name": "Makeup",
    "description": "Cosmetics and makeup products",
    "parent": "Beauty & Personal Care",
    "image": {
      "url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400"
    },
    "order": 2,
    "isFeatured": false
  },
  {
    "name": "Toys & Games",
    "description": "Toys, games, and entertainment for kids",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400"
    },
    "order": 7,
    "isFeatured": false
  },
  {
    "name": "Action Figures",
    "description": "Collectible figures and character toys",
    "parent": "Toys & Games",
    "image": {
      "url": "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=400"
    },
    "order": 1,
    "isFeatured": false
  },
  {
    "name": "Board Games",
    "description": "Family games and puzzles",
    "parent": "Toys & Games",
    "image": {
      "url": "https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400"
    },
    "order": 2,
    "isFeatured": false
  },
  {
    "name": "Automotive",
    "description": "Car accessories and automotive parts",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400"
    },
    "order": 8,
    "isFeatured": false
  },
  {
    "name": "Car Accessories",
    "description": "Interior and exterior car accessories",
    "parent": "Automotive",
    "image": {
      "url": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400"
    },
    "order": 1,
    "isFeatured": false
  },
  {
    "name": "Car Parts",
    "description": "Replacement parts and components",
    "parent": "Automotive",
    "image": {
      "url": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"
    },
    "order": 2,
    "isFeatured": false
  },
  {
    "name": "Pet Supplies",
    "description": "Food, toys, and accessories for pets",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400"
    },
    "order": 9,
    "isFeatured": false
  },
  {
    "name": "Dog Supplies",
    "description": "Food, toys, and accessories for dogs",
    "parent": "Pet Supplies",
    "image": {
      "url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"
    },
    "order": 1,
    "isFeatured": false
  },
  {
    "name": "Cat Supplies",
    "description": "Food, toys, and accessories for cats",
    "parent": "Pet Supplies",
    "image": {
      "url": "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400"
    },
    "order": 2,
    "isFeatured": false
  },
  {
    "name": "Grocery & Food",
    "description": "Food items, beverages, and groceries",
    "parent": null,
    "image": {
      "url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"
    },
    "order": 10,
    "isFeatured": true
  },
  {
    "name": "Fresh Produce",
    "description": "Fruits, vegetables, and fresh food",
    "parent": "Grocery & Food",
    "image": {
      "url": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400"
    },
    "order": 1,
    "isFeatured": false
  },
  {
    "name": "Snacks & Beverages",
    "description": "Chips, cookies, drinks, and snacks",
    "parent": "Grocery & Food",
    "image": {
      "url": "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400"
    },
    "order": 2,
    "isFeatured": false
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n📡 Connected to MongoDB');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Optional: Clear existing categories (uncomment if you want to start fresh)
    // await Category.deleteMany({});
    // console.log('🗑️  Cleared existing categories\n');

    // Step 1: Create parent categories first
    console.log('📦 Step 1: Creating parent categories...');
    const parentCategories = categoriesData.filter(c => c.parent === null);

    const createdParents = [];
    for (const parentData of parentCategories) {
      const existing = await Category.findOne({ name: parentData.name });
      if (existing) {
        console.log(`   ⚠️  "${parentData.name}" already exists, skipping...`);
        createdParents.push(existing);
      } else {
        const newParent = await Category.create(parentData);
        console.log(`   ✅ Created: ${parentData.name}`);
        createdParents.push(newParent);
      }
    }

    console.log(`\n✨ Created ${createdParents.length} parent categories\n`);

    // Step 2: Create a mapping of parent names to their IDs
    const parentMap = {};
    createdParents.forEach(parent => {
      parentMap[parent.name] = parent._id;
    });

    // Step 3: Create subcategories with proper parent references
    console.log('📁 Step 2: Creating subcategories...');
    const subcategories = categoriesData.filter(c => c.parent !== null);

    let createdSubCount = 0;
    for (const subData of subcategories) {
      const existing = await Category.findOne({ name: subData.name });
      if (existing) {
        console.log(`   ⚠️  "${subData.name}" already exists, skipping...`);
      } else {
        const parentId = parentMap[subData.parent];
        if (!parentId) {
          console.log(`   ❌ Parent "${subData.parent}" not found for "${subData.name}"`);
          continue;
        }

        await Category.create({
          ...subData,
          parent: parentId
        });
        console.log(`   ✅ Created: ${subData.name} (under ${subData.parent})`);
        createdSubCount++;
      }
    }

    console.log(`\n✨ Created ${createdSubCount} subcategories\n`);

    // Final summary
    const totalCategories = await Category.countDocuments();
    const totalParents = await Category.countDocuments({ level: 0 });
    const totalSubs = await Category.countDocuments({ level: 1 });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Database Statistics:`);
    console.log(`   Total Categories: ${totalCategories}`);
    console.log(`   Parent Categories: ${totalParents}`);
    console.log(`   Subcategories: ${totalSubs}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding categories:', error);
    process.exit(1);
  }
}

// Run the seeder
seedCategories();