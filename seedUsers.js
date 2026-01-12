import mongoose from 'mongoose';
import User from './models/UserModel.js'; // Adjust path to your model
import dotenv from 'dotenv';

dotenv.config();

const usersData = [
  // Admin account
  {
    name: "Admin User",
    email: "admin@shopaura.com",
    password: "admin123",
    role: "admin",
    avatar: "https://ui-avatars.com/api/?name=Admin+User&background=7c3aed&color=fff&size=150",
    isActive: true
  },
  
  // Seller accounts
  {
    name: "TechGear Store",
    email: "techgear@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=TechGear+Store&background=3b82f6&color=fff&size=150",
    isActive: true
  },
  {
    name: "Fashion Hub",
    email: "fashionhub@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=Fashion+Hub&background=ec4899&color=fff&size=150",
    isActive: true
  },
  {
    name: "Home Essentials",
    email: "homeessentials@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=Home+Essentials&background=10b981&color=fff&size=150",
    isActive: true
  },
  {
    name: "Sports Zone",
    email: "sportszone@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=Sports+Zone&background=f59e0b&color=fff&size=150",
    isActive: true
  },
  {
    name: "Book Haven",
    email: "bookhaven@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=Book+Haven&background=8b5cf6&color=fff&size=150",
    isActive: true
  },
  {
    name: "Beauty Palace",
    email: "beautypalace@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=Beauty+Palace&background=f43f5e&color=fff&size=150",
    isActive: true
  },
  {
    name: "Toy Kingdom",
    email: "toykingdom@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=Toy+Kingdom&background=06b6d4&color=fff&size=150",
    isActive: true
  },
  {
    name: "Auto Parts Pro",
    email: "autopartspro@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=Auto+Parts+Pro&background=64748b&color=fff&size=150",
    isActive: true
  },
  {
    name: "Pet Paradise",
    email: "petparadise@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=Pet+Paradise&background=84cc16&color=fff&size=150",
    isActive: true
  },
  {
    name: "Grocery Mart",
    email: "grocerymart@shop.com",
    password: "seller123",
    role: "seller",
    avatar: "https://ui-avatars.com/api/?name=Grocery+Mart&background=14b8a6&color=fff&size=150",
    isActive: true
  },
  
  // Sample buyer accounts
  {
    name: "John Doe",
    email: "john@example.com",
    password: "buyer123",
    role: "buyer",
    avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random&size=150",
    isActive: true
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    password: "buyer123",
    role: "buyer",
    avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=random&size=150",
    isActive: true
  },
  {
    name: "Mike Johnson",
    email: "mike@example.com",
    password: "buyer123",
    role: "buyer",
    avatar: "https://ui-avatars.com/api/?name=Mike+Johnson&background=random&size=150",
    isActive: true
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n📡 Connected to MongoDB');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('👥 Creating user accounts...\n');

    let createdCount = 0;
    let skippedCount = 0;
    const createdByRole = { admin: 0, seller: 0, buyer: 0 };

    for (const userData of usersData) {
      // Check if user already exists
      const existing = await User.findOne({ email: userData.email });
      
      if (existing) {
        console.log(`   ⚠️  ${userData.role.toUpperCase()}: "${userData.name}" (${userData.email}) already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Create user - Password will be auto-hashed by the pre-save hook
      await User.create(userData);

      console.log(`   ✅ ${userData.role.toUpperCase()}: ${userData.name} (${userData.email})`);
      createdCount++;
      createdByRole[userData.role]++;
    }

    // Final summary
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalUsers = await User.countDocuments();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 USER SEEDING COMPLETED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Users Created: ${createdCount}`);
    console.log(`   ⚠️  Users Skipped: ${skippedCount}`);
    console.log(`\n👥 Database Statistics:`);
    console.log(`   🔑 Admins: ${totalAdmins} (Created: ${createdByRole.admin})`);
    console.log(`   🏪 Sellers: ${totalSellers} (Created: ${createdByRole.seller})`);
    console.log(`   🛍️  Buyers: ${totalBuyers} (Created: ${createdByRole.buyer})`);
    console.log(`   📈 Total Users: ${totalUsers}`);
    
    console.log('\n💡 Login Credentials:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   🔑 Admin:   admin@shopaura.com     / admin123');
    console.log('   🏪 Sellers: *@shop.com             / seller123');
    console.log('   🛍️  Buyers:  *@example.com          / buyer123');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📋 Seller Emails:');
    const sellers = usersData.filter(u => u.role === 'seller');
    sellers.forEach((seller, i) => {
      console.log(`   ${i + 1}. ${seller.name.padEnd(20)} - ${seller.email}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding users:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the seeder
seedUsers();
