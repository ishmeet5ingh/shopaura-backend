import mongoose from 'mongoose';
import Product from './models/ProductModel.js';
import Category from './models/CategoryModel.js';
import User from './models/UserModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Realistic product data matched to your exact categories
const productsByCategory = {
  "Electronics": [
    { name: "Wireless Bluetooth Speaker Pro", description: "Portable waterproof speaker with 360° sound, 20-hour battery life, and deep bass. Perfect for outdoor adventures.", price: 2499, discount: 15 },
    { name: "Smart WiFi Security Camera", description: "1080P HD camera with night vision, motion detection, and cloud storage. Monitor your home from anywhere.", price: 3999, discount: 20 },
    { name: "Digital Kitchen Scale", description: "Precise electronic scale with LCD display, measures up to 5kg with 1g accuracy. Ideal for cooking and baking.", price: 799, discount: 10 },
    { name: "Wireless Charging Pad", description: "Fast 15W wireless charger compatible with all Qi-enabled devices. Sleek design with LED indicator.", price: 1299, discount: 12 },
    { name: "USB-C Hub 7-in-1", description: "Multi-port adapter with HDMI, USB 3.0, SD card reader, and PD charging. Essential for laptops.", price: 1899, discount: 18 }
  ],
  "Smartphones": [
    { name: "5G Android Smartphone 128GB", description: "6.5-inch AMOLED display, 48MP triple camera, 5000mAh battery. Latest 5G connectivity for blazing speeds.", price: 16999, discount: 15 },
    { name: "Budget Smartphone 64GB Dual SIM", description: "Affordable phone with 6.2-inch display, 13MP camera, and long-lasting 4000mAh battery.", price: 7999, discount: 10 },
    { name: "Tempered Glass Screen Protector", description: "9H hardness protection with oleophobic coating. Easy bubble-free installation.", price: 199, discount: 5 },
    { name: "Silicone Phone Case with Grip", description: "Shock-absorbing protective case with anti-slip design. Available in multiple colors.", price: 299, discount: 8 },
    { name: "Fast Charging USB-C Cable 2M", description: "Braided nylon cable with reinforced connectors. Supports fast charging up to 60W.", price: 349, discount: 12 }
  ],
  "Laptops": [
    { name: "Gaming Laptop 15.6 inch RTX", description: "Powerful laptop with NVIDIA RTX graphics, Intel i7, 16GB RAM, 512GB SSD. RGB backlit keyboard.", price: 84999, discount: 12 },
    { name: "Business Ultrabook 14 inch", description: "Slim and lightweight with Intel i5, 8GB RAM, 256GB SSD. All-day battery life for professionals.", price: 45999, discount: 10 },
    { name: "Laptop Cooling Stand with Fans", description: "Ergonomic aluminum stand with dual cooling fans and 6 adjustable heights.", price: 1499, discount: 15 },
    { name: "Wireless Mouse and Keyboard Combo", description: "Silent wireless keyboard and optical mouse with nano USB receiver. 2-year battery life.", price: 1699, discount: 18 },
    { name: "Laptop Sleeve 15.6 inch Waterproof", description: "Padded protective sleeve with extra pocket for accessories. Water-resistant nylon.", price: 899, discount: 8 }
  ],
  "Fashion": [
    { name: "Cotton Casual T-Shirt Unisex", description: "100% premium cotton t-shirt with modern fit. Available in 8 vibrant colors.", price: 499, discount: 20 },
    { name: "Denim Jeans Slim Fit", description: "Stretchable denim with comfortable fit and classic 5-pocket design. Fade-resistant.", price: 1499, discount: 25 },
    { name: "Running Shoes Lightweight", description: "Breathable mesh sneakers with cushioned sole. Perfect for jogging and gym.", price: 2299, discount: 15 },
    { name: "Leather Bifold Wallet", description: "Genuine leather wallet with 8 card slots and bill compartment. RFID blocking.", price: 899, discount: 12 },
    { name: "Polarized Sunglasses UV400", description: "Stylish sunglasses with 100% UV protection and anti-glare coating.", price: 999, discount: 18 }
  ],
  "Men's Clothing": [
    { name: "Formal Cotton Shirt Slim Fit", description: "Premium cotton shirt perfect for office wear. Non-iron fabric in classic colors.", price: 1099, discount: 15 },
    { name: "Chino Pants Stretchable", description: "Comfortable chino trousers with stretch fabric and modern fit. Multiple colors.", price: 1599, discount: 20 },
    { name: "Polo Collar T-Shirt", description: "Premium pique cotton polo with ribbed collar and cuffs. Breathable fabric.", price: 849, discount: 12 },
    { name: "Genuine Leather Belt Classic", description: "Full-grain leather belt with metal buckle. Reversible black and brown.", price: 699, discount: 10 },
    { name: "Winter Jacket Water-Resistant", description: "Warm padded jacket with inner fleece lining and zippered pockets.", price: 3499, discount: 25 }
  ],
  "Women's Clothing": [
    { name: "Designer Kurti Cotton Blend", description: "Beautiful ethnic kurti with embroidery and comfortable fit. Perfect for any occasion.", price: 999, discount: 20 },
    { name: "Maxi Dress Floral Print", description: "Elegant flowing dress with floral pattern and adjustable waist. Comfortable all-day wear.", price: 1899, discount: 22 },
    { name: "Cotton Leggings Pack of 3", description: "Stretchable ankle-length leggings in assorted colors. 4-way stretch fabric.", price: 749, discount: 15 },
    { name: "Designer Handbag with Sling", description: "Stylish PU leather handbag with multiple compartments and detachable sling.", price: 1499, discount: 18 },
    { name: "Traditional Saree with Blouse", description: "Beautiful printed saree with matching stitched blouse piece. Ready to wear.", price: 1999, discount: 25 }
  ],
  "Home & Kitchen": [
    { name: "Non-Stick Cookware Set 5-Piece", description: "Premium non-stick coating, glass lids, and heat-resistant handles. Dishwasher safe.", price: 3299, discount: 20 },
    { name: "Dinner Set 24 Pieces Ceramic", description: "Elegant dinnerware set for 6 people. Microwave and dishwasher safe.", price: 2299, discount: 15 },
    { name: "Cotton Bed Sheet King Size", description: "Premium 100% cotton bed sheet set with 2 pillow covers. Soft and breathable.", price: 1199, discount: 18 },
    { name: "Modern Wall Clock Silent", description: "12-inch wall clock with sweeping movement for silent operation. Battery included.", price: 599, discount: 10 },
    { name: "LED Desk Lamp Adjustable", description: "Energy-efficient LED lamp with 3 brightness levels and flexible arm.", price: 899, discount: 12 }
  ],
  "Kitchen Appliances": [
    { name: "Electric Kettle 1.7L Stainless", description: "Fast-boiling kettle with auto shut-off and boil-dry protection. 1500W power.", price: 1099, discount: 15 },
    { name: "Mixer Grinder 750W 3 Jars", description: "Powerful motor with stainless steel jars for grinding, blending, and juicing.", price: 2999, discount: 20 },
    { name: "Microwave Oven 23L Solo", description: "Digital microwave with 10 power levels and express cooking. Child safety lock.", price: 6499, discount: 18 },
    { name: "Induction Cooktop 2000W", description: "Touch control induction with timer and temperature settings. Energy efficient.", price: 2599, discount: 12 },
    { name: "Rice Cooker 1.8L Automatic", description: "Multi-function cooker with keep-warm feature and non-stick inner pot.", price: 1699, discount: 10 }
  ],
  "Home Decor": [
    { name: "Canvas Wall Art Set of 3", description: "Modern abstract art prints on canvas with wooden frames. Ready to hang.", price: 1299, discount: 15 },
    { name: "Ceramic Decorative Vase", description: "Handcrafted vase with glossy finish. Perfect for fresh or artificial flowers.", price: 699, discount: 10 },
    { name: "Anti-Slip Bath Mat Set", description: "Microfiber mats with quick-dry technology and non-slip backing. Set of 3.", price: 799, discount: 12 },
    { name: "Photo Frame Collage Set", description: "Set of 7 frames in different sizes with mounting hardware included.", price: 999, discount: 18 },
    { name: "Artificial Plant with Pot", description: "Realistic faux plant in ceramic pot. No maintenance required.", price: 849, discount: 8 }
  ],
  "Sports & Fitness": [
    { name: "Yoga Mat 6mm Non-Slip", description: "Extra thick exercise mat with carrying strap and non-slip texture. Eco-friendly.", price: 799, discount: 15 },
    { name: "Adjustable Dumbbells 20kg Set", description: "Quick-adjust dumbbells from 2.5kg to 20kg. Space-saving design.", price: 3499, discount: 20 },
    { name: "Resistance Bands Set of 5", description: "Latex-free bands with varying resistance levels and carrying pouch.", price: 699, discount: 10 },
    { name: "Running Shoes Sports Cushion", description: "Lightweight shoes with air cushion technology and breathable mesh upper.", price: 2699, discount: 25 },
    { name: "Insulated Water Bottle 1L", description: "Stainless steel bottle keeps drinks cold for 24 hours. Leak-proof lid.", price: 599, discount: 12 }
  ],
  "Gym Equipment": [
    { name: "Treadmill Foldable Electric", description: "Home treadmill with LED display, 12 programs, and safety key. Max speed 10km/h.", price: 28999, discount: 15 },
    { name: "Exercise Bike Stationary", description: "Adjustable resistance bike with LCD monitor and comfortable padded seat.", price: 14999, discount: 18 },
    { name: "Push-Up Bars Ergonomic", description: "Non-slip foam grips and rotating handles for better wrist support.", price: 699, discount: 10 },
    { name: "Ab Roller Wheel with Mat", description: "Dual wheels for stability with knee pad included. Core strengthening tool.", price: 499, discount: 8 },
    { name: "Gym Gloves with Wrist Wrap", description: "Padded palm gloves with adjustable wrist support. Breathable fabric.", price: 599, discount: 12 }
  ],
  "Outdoor Sports": [
    { name: "Camping Tent 4-Person Waterproof", description: "Easy setup dome tent with rainfly and ventilation windows. Includes carry bag.", price: 5499, discount: 20 },
    { name: "Sleeping Bag -10°C Rated", description: "Insulated sleeping bag with compression sack. Suitable for 3-season camping.", price: 2299, discount: 15 },
    { name: "Hiking Backpack 65L Trekking", description: "Large capacity backpack with rain cover, multiple pockets, and padded straps.", price: 2899, discount: 18 },
    { name: "LED Camping Lantern Rechargeable", description: "Bright 1000-lumen lantern with multiple modes and power bank feature.", price: 999, discount: 10 },
    { name: "Trekking Poles Adjustable Pair", description: "Aluminum poles with anti-shock springs and tungsten carbide tips.", price: 1499, discount: 12 }
  ],
  "Books & Stationery": [
    { name: "Spiral Notebook Set A4 Size", description: "Pack of 5 ruled notebooks with 200 pages each. Premium quality paper.", price: 399, discount: 10 },
    { name: "Gel Pen Set 10 Colors", description: "Smooth-writing gel pens with 0.7mm tip and comfortable grip.", price: 249, discount: 5 },
    { name: "LED Study Lamp Foldable", description: "Eye-care LED lamp with touch control and adjustable brightness. USB powered.", price: 899, discount: 15 },
    { name: "Desk Organizer with Drawers", description: "Multi-compartment organizer with 3 drawers for efficient desk management.", price: 699, discount: 12 },
    { name: "Scientific Calculator 240 Functions", description: "Solar and battery powered calculator with 2-line display.", price: 599, discount: 8 }
  ],
  "Fiction Books": [
    { name: "Bestselling Mystery Novel Collection", description: "Set of 3 award-winning mystery thrillers. Perfect for book lovers.", price: 899, discount: 20 },
    { name: "Romance Novel Paperback Edition", description: "Heartwarming contemporary romance with 400 pages. Bestselling author.", price: 349, discount: 15 },
    { name: "Fantasy Series Complete Set", description: "All 5 books in the epic fantasy series. Over 2000 pages of adventure.", price: 1699, discount: 25 },
    { name: "Crime Thriller Hardcover", description: "Edge-of-your-seat suspense novel from award-winning author.", price: 499, discount: 10 },
    { name: "Classic Literature Collection", description: "Timeless classics in beautiful hardcover editions. Set of 4 books.", price: 1299, discount: 18 }
  ],
  "Office Supplies": [
    { name: "Ergonomic Office Chair Adjustable", description: "Mesh back chair with lumbar support, adjustable height, and 360° swivel.", price: 5999, discount: 20 },
    { name: "File Organizer Magazine Holder", description: "Set of 3 organizers with labels. Sturdy cardboard construction.", price: 599, discount: 15 },
    { name: "Sticky Notes Assorted Pack", description: "450 sheets in 6 bright colors. Multiple sizes for different uses.", price: 249, discount: 5 },
    { name: "Whiteboard 90x60cm Magnetic", description: "Wall-mounted board with aluminum frame. Includes 2 markers and eraser.", price: 1499, discount: 18 },
    { name: "Paper Shredder Cross-Cut", description: "8-sheet capacity shredder with 15L basket. Auto start and reverse.", price: 2999, discount: 12 }
  ],
  "Beauty & Personal Care": [
    { name: "Skincare Set 5-Step Routine", description: "Complete skincare regimen with cleanser, toner, serum, moisturizer, and sunscreen.", price: 2499, discount: 25 },
    { name: "Hair Dryer Professional 2000W", description: "Ionic technology for frizz-free hair. 3 heat and 2 speed settings.", price: 1899, discount: 18 },
    { name: "Luxury Perfume 100ml EDT", description: "Long-lasting fragrance with floral and woody notes. Premium bottle.", price: 1299, discount: 15 },
    { name: "Makeup Brush Set 12 Pieces", description: "Professional-grade brushes with synthetic bristles and case.", price: 899, discount: 20 },
    { name: "Electric Trimmer Cordless", description: "Multi-grooming kit with 5 attachments and 60-minute runtime.", price: 1599, discount: 15 }
  ],
  "Skincare": [
    { name: "Gentle Face Wash 150ml", description: "pH-balanced cleanser for all skin types. Removes impurities without drying.", price: 349, discount: 10 },
    { name: "Hydrating Moisturizer SPF 30", description: "Lightweight daily moisturizer with sun protection and hyaluronic acid.", price: 699, discount: 15 },
    { name: "Vitamin C Brightening Serum", description: "20% vitamin C serum reduces dark spots and boosts radiance.", price: 1099, discount: 20 },
    { name: "Anti-Aging Night Cream 50g", description: "Rich cream with retinol and peptides for overnight repair.", price: 899, discount: 18 },
    { name: "Exfoliating Face Scrub Natural", description: "Gentle scrub with natural ingredients removes dead skin cells.", price: 399, discount: 8 }
  ],
  "Makeup": [
    { name: "Matte Lipstick Set 6 Shades", description: "Long-lasting formula in nude, pink, and red tones. Moisturizing.", price: 899, discount: 20 },
    { name: "HD Foundation Full Coverage", description: "Flawless finish foundation available in 12 shades. Oil-free formula.", price: 999, discount: 15 },
    { name: "Eyeshadow Palette 18 Colors", description: "Mix of matte and shimmer shades. Highly pigmented and blendable.", price: 799, discount: 18 },
    { name: "Waterproof Kajal Pencil", description: "Smudge-proof black kajal lasts up to 12 hours. Ophthalmologist tested.", price: 249, discount: 5 },
    { name: "Volumizing Mascara Black", description: "Lengthens and thickens lashes without clumping. Waterproof formula.", price: 599, discount: 12 }
  ],
  "Toys & Games": [
    { name: "Building Blocks Set 1000 Pieces", description: "Compatible with major brands. Includes storage box and building ideas.", price: 1299, discount: 20 },
    { name: "Remote Control Racing Car", description: "Fast RC car with rechargeable battery. Reaches 20km/h speed.", price: 1799, discount: 18 },
    { name: "Plush Teddy Bear 24 Inches", description: "Soft and cuddly bear made from hypoallergenic materials. Perfect gift.", price: 799, discount: 15 },
    { name: "Kids Bicycle 16 Inch with Wheels", description: "Colorful cycle with training wheels and front basket. For ages 4-7.", price: 4499, discount: 15 },
    { name: "Drawing Art Set 150 Pieces", description: "Complete art supplies with crayons, markers, paints, and coloring books.", price: 999, discount: 10 }
  ],
  "Action Figures": [
    { name: "Superhero Action Figure 12 Inch", description: "Articulated figure with removable accessories and display stand.", price: 999, discount: 15 },
    { name: "Robot Transformer 3-in-1", description: "Converts between robot, car, and jet modes. No tools required.", price: 1499, discount: 20 },
    { name: "Dinosaur Toy Set 12 Pieces", description: "Realistic dinosaur figures made from durable non-toxic plastic.", price: 799, discount: 12 },
    { name: "Army Soldiers Set 100 Pieces", description: "Military figures with tanks, helicopters, and accessories.", price: 899, discount: 10 },
    { name: "Space Shuttle Playset", description: "Astronaut figures with spaceship, rover, and space station.", price: 1199, discount: 18 }
  ],
  "Board Games": [
    { name: "Wooden Chess Set with Board", description: "Premium wood chess with folding board and felt interior. 15-inch board.", price: 899, discount: 15 },
    { name: "Monopoly Classic Board Game", description: "The original property trading game for family fun. 2-6 players.", price: 1499, discount: 20 },
    { name: "Jigsaw Puzzle 1000 Pieces", description: "Challenging puzzle with beautiful landscape image. 27x19 inches.", price: 699, discount: 12 },
    { name: "Carrom Board Full Size Ply", description: "26-inch professional carrom with coins, striker, and powder.", price: 2299, discount: 18 },
    { name: "Playing Cards Premium Deck", description: "Pack of 2 plastic-coated cards. Casino quality and durable.", price: 249, discount: 5 }
  ],
  "Automotive": [
    { name: "Portable Car Vacuum Cleaner", description: "120W wet and dry vacuum with 4.5m cable. Multiple attachments included.", price: 1499, discount: 15 },
    { name: "Dash Cam 1080P with Night Vision", description: "Full HD recording with loop recording and G-sensor. 170° wide angle.", price: 3299, discount: 20 },
    { name: "Magnetic Phone Holder Mount", description: "Strong magnets hold phone securely. 360° rotation and adjustable arm.", price: 399, discount: 10 },
    { name: "Digital Tire Pressure Gauge", description: "Accurate LCD display with backlight. Measures PSI, BAR, KPA, and KG/CM.", price: 499, discount: 8 },
    { name: "Car Jump Starter 12000mAh", description: "Portable power bank with jump cables, flashlight, and USB ports.", price: 4499, discount: 18 }
  ],
  "Car Accessories": [
    { name: "Car Seat Covers Full Set", description: "Universal fit covers in premium PU leather. Front and rear seats.", price: 2299, discount: 20 },
    { name: "Leather Steering Wheel Cover", description: "Genuine leather with non-slip grip. 38cm diameter fits most cars.", price: 599, discount: 12 },
    { name: "3D Car Floor Mats Waterproof", description: "Custom-fit mats with raised edges. Easy to clean TPE material.", price: 1199, discount: 15 },
    { name: "Foldable Windshield Sunshade", description: "Reflective shade keeps car cool. Universal fit for most vehicles.", price: 399, discount: 10 },
    { name: "Car Trunk Organizer Foldable", description: "Multi-compartment organizer with anti-slip base. Collapsible design.", price: 799, discount: 8 }
  ],
  "Car Parts": [
    { name: "Synthetic Engine Oil 5W-30 5L", description: "High-performance synthetic oil for petrol and diesel engines.", price: 2299, discount: 10 },
    { name: "Air Filter Washable Universal", description: "High-flow air filter improves performance. Reusable and cleanable.", price: 699, discount: 8 },
    { name: "Ceramic Brake Pads Front Set", description: "Low-dust brake pads with excellent stopping power. Fits most cars.", price: 1799, discount: 12 },
    { name: "Silicone Wiper Blades 24 Inch", description: "Set of 2 premium wipers with graphite coating. Streak-free wiping.", price: 599, discount: 5 },
    { name: "Car Battery 12V 55Ah Sealed", description: "Maintenance-free battery with 36-month warranty. Easy installation.", price: 5499, discount: 18 }
  ],
  "Pet Supplies": [
    { name: "Premium Dog Food 10kg Chicken", description: "Nutritious dry food with real chicken, vegetables, and vitamins. For adult dogs.", price: 2299, discount: 15 },
    { name: "Cat Litter Clumping 10kg", description: "Bentonite clay litter with odor control. 99% dust-free and flushable.", price: 899, discount: 10 },
    { name: "Pet Bed Cushion Washable Large", description: "Soft orthopedic bed with removable cover. Non-slip bottom.", price: 1499, discount: 18 },
    { name: "Pet Toys Variety Pack 10pcs", description: "Assorted chew toys, balls, and squeakers for dogs and cats.", price: 599, discount: 12 },
    { name: "Automatic Pet Feeder Timer", description: "Programmable feeder with 6L capacity and voice recording.", price: 2899, discount: 20 }
  ],
  "Dog Supplies": [
    { name: "Dog Collar and Leash Set Nylon", description: "Adjustable collar with matching 1.5m leash. Reflective stitching for safety.", price: 699, discount: 10 },
    { name: "Dog Shampoo Natural Formula", description: "Gentle tearless shampoo with aloe vera and oatmeal. 500ml bottle.", price: 449, discount: 8 },
    { name: "Training Treats Chicken Flavor", description: "Soft and chewy rewards for training. Low calorie and digestible.", price: 349, discount: 5 },
    { name: "Stainless Steel Dog Bowl Set", description: "2 bowls for food and water. Non-skid rubber base prevents sliding.", price: 599, discount: 12 },
    { name: "Outdoor Dog House Waterproof", description: "Durable plastic house with raised floor and ventilation. Medium size.", price: 4499, discount: 20 }
  ],
  "Cat Supplies": [
    { name: "Cat Scratching Post 60cm Tall", description: "Sisal-wrapped post with plush top platform and hanging toys.", price: 1499, discount: 18 },
    { name: "Wet Cat Food Variety Pack 12x85g", description: "Grain-free wet food in chicken, tuna, and salmon flavors.", price: 999, discount: 12 },
    { name: "Cat Carrier Airline Approved", description: "Hard-sided carrier with ventilation and secure door. Top-loading design.", price: 1799, discount: 15 },
    { name: "Covered Litter Box with Filter", description: "Privacy hood reduces odor and litter scatter. Charcoal filter included.", price: 1199, discount: 10 },
    { name: "Cat Tree Multi-Level 120cm", description: "3-tier cat tower with condos, perches, and sisal posts.", price: 4499, discount: 20 }
  ],
  "Grocery & Food": [
    { name: "Organic Basmati Rice 5kg Premium", description: "Aged basmati rice with long grains and aromatic fragrance. Pesticide-free.", price: 699, discount: 10 },
    { name: "Sunflower Cooking Oil 5L Refined", description: "Heart-healthy oil rich in vitamin E. Light flavor for everyday cooking.", price: 899, discount: 8 },
    { name: "Whole Wheat Flour 10kg Chakki", description: "Freshly ground whole wheat atta. High in fiber and nutrients.", price: 599, discount: 5 },
    { name: "Mixed Dry Fruits 1kg Premium", description: "Almonds, cashews, raisins, and pistachios. Fresh and crunchy.", price: 1499, discount: 15 },
    { name: "Natural Honey 500g Raw", description: "Pure unprocessed honey with no added sugar. Rich in antioxidants.", price: 399, discount: 10 }
  ],
  "Fresh Produce": [
    { name: "Fresh Vegetable Box 5kg Organic", description: "Seasonal mix of tomatoes, potatoes, onions, and leafy greens. Farm fresh.", price: 449, discount: 10 },
    { name: "Seasonal Fruit Basket 3kg Mixed", description: "Apples, bananas, oranges, and grapes. Hand-picked and ripe.", price: 599, discount: 8 },
    { name: "Button Mushrooms 250g Fresh", description: "Premium quality mushrooms. Perfect for salads and cooking.", price: 159, discount: 5 },
    { name: "Spinach and Kale Mix 500g", description: "Nutrient-rich leafy greens. Washed and ready to cook.", price: 129, discount: 5 },
    { name: "Organic Herbs Bundle Fresh", description: "Basil, coriander, mint, and parsley. Aromatic and pesticide-free.", price: 99, discount: 5 }
  ],
  "Snacks & Beverages": [
    { name: "Potato Chips Salted 200g Pack", description: "Crispy chips made from real potatoes. No artificial flavors.", price: 99, discount: 10 },
    { name: "Assorted Cookies 1kg Gift Tin", description: "Butter, chocolate chip, and oatmeal cookies. Perfect for gifting.", price: 449, discount: 12 },
    { name: "Soft Drink Combo Pack 12 Cans", description: "330ml cans of cola, lemon, and orange flavors. Chilled and refreshing.", price: 599, discount: 15 },
    { name: "Instant Noodles Masala 12 Pack", description: "Quick-cook noodles with spicy masala flavor. Ready in 2 minutes.", price: 299, discount: 8 },
    { name: "Chocolate Bar Variety Pack 10pcs", description: "Milk, dark, and white chocolate bars from popular brands.", price: 499, discount: 18 }
  ]
};

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n📡 Connected to MongoDB');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sellers = await User.find({ role: 'seller' });
    console.log(`👥 Found ${sellers.length} sellers\n`);

    if (sellers.length === 0) {
      console.log('❌ No sellers found! Please run seedUsers.js first.');
      process.exit(1);
    }

    const categories = await Category.find({ isActive: true });
    console.log(`📁 Found ${categories.length} categories\n`);

    if (categories.length === 0) {
      console.log('❌ No categories found! Please run seedCategories.js first.');
      process.exit(1);
    }

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat;
    });

    console.log('🛍️  Creating 5 products per seller (no images - upload manually)...\n');

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const seller of sellers) {
      console.log(`\n👤 Creating products for: ${seller.name}`);
      
      const categoryNames = Object.keys(productsByCategory);
      const shuffled = categoryNames.sort(() => 0.5 - Math.random());
      const sellerCategories = shuffled.slice(0, 5);

      for (let i = 0; i < 5; i++) {
        const categoryName = sellerCategories[i];
        const category = categoryMap[categoryName];
        
        if (!category) {
          console.log(`   ⚠️  Category "${categoryName}" not found, skipping...`);
          continue;
        }

        const products = productsByCategory[categoryName];
        const productTemplate = products[i % products.length];

        // Calculate prices correctly
        const priceVariation = Math.floor(Math.random() * 200) - 100;
        const regularPrice = Math.max(productTemplate.price + priceVariation, 99);

        // Ensure discount is at least 5% to avoid validation errors
        const effectiveDiscount = Math.max(productTemplate.discount, 5);
        const discountAmount = Math.floor((regularPrice * effectiveDiscount) / 100);
        const discountedPrice = regularPrice - discountAmount;

        // Ensure discounted price is ALWAYS less than regular price
        const finalRegularPrice = regularPrice;
        const finalDiscountPrice = Math.min(discountedPrice, regularPrice - 1);
        
        const stock = Math.floor(Math.random() * 100) + 20;

        const productData = {
          name: productTemplate.name,
          description: productTemplate.description,
          price: finalRegularPrice,
          discountPrice: finalDiscountPrice,
          category: category._id,
          seller: seller._id,
          stock: stock,
          images: [], // Empty - you'll upload manually
          thumbnail: {
            url: 'https://placehold.co/400x400/EEE/31343C?text=Upload+Image',
            public_id: null,
            alt: productTemplate.name
          },
          specifications: {
            Brand: seller.name.split(' ')[0],
            Warranty: "1 Year Manufacturer Warranty",
            "Country of Origin": "India",
            "Model Number": `${category.slug.toUpperCase().substring(0, 3)}-${Math.floor(Math.random() * 9999)}`,
            "In Stock": "Yes"
          },
          tags: [category.name.toLowerCase(), category.slug, 'featured', 'bestseller'],
          isActive: true,
          averageRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
          numReviews: Math.floor(Math.random() * 100)
        };

        const existing = await Product.findOne({
          name: productData.name,
          seller: seller._id
        });

        if (existing) {
          console.log(`   ⚠️  "${productData.name}" already exists, skipping...`);
          totalSkipped++;
          continue;
        }

        await Product.create(productData);
        console.log(`   ✅ ${productData.name} - ₹${finalDiscountPrice} (${category.name})`);
        totalCreated++;
      }
    }

    const totalProducts = await Product.countDocuments();
    const productsBySeller = await Product.aggregate([
      {
        $group: {
          _id: '$seller',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $unwind: '$seller'
      },
      {
        $project: {
          sellerName: '$seller.name',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 PRODUCT SEEDING COMPLETED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Products Created: ${totalCreated}`);
    console.log(`   ⚠️  Products Skipped: ${totalSkipped}`);
    console.log(`   📦 Total Products in DB: ${totalProducts}`);
    console.log(`   📷 Images: Upload manually via admin panel`);

    console.log(`\n📈 Products by Seller:`);
    productsBySeller.forEach(item => {
      console.log(`   ${item.sellerName}: ${item.count} products`);
    });

    console.log('\n💡 All products created with placeholder images');
    console.log('💡 Upload product images manually through the admin panel');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding products:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

seedProducts();
