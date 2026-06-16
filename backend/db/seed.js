require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../src/config/db');

const products = [
  // Appetizers
  {
    name: 'Crispy Spring Rolls',
    description: 'Hand-rolled vegetable spring rolls with sweet chili dip.',
    price: 120.00,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    category: 'Appetizers',
  },
  {
    name: 'Garlic Herb Bread',
    description: 'Toasted baguette with roasted garlic butter and herbs.',
    price: 95.00,
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=400',
    category: 'Appetizers',
  },
  {
    name: 'Calamares',
    description: 'Lightly battered squid rings with spiced vinegar.',
    price: 160.00,
    image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
    category: 'Appetizers',
  },
  // Main Dish
  {
    name: 'Grilled Chicken Inasal',
    description: 'Charcoal-grilled chicken marinated in calamansi and lemongrass.',
    price: 280.00,
    image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c5?w=400',
    category: 'Main Dish',
  },
  {
    name: 'Beef Stir Fry',
    description: 'Tender beef strips wok-tossed with peppers in oyster sauce.',
    price: 320.00,
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    category: 'Main Dish',
  },
  {
    name: 'Pasta Carbonara',
    description: 'Creamy egg-based pasta with smoked bacon and parmesan.',
    price: 260.00,
    image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    category: 'Main Dish',
  },
  {
    name: 'Pan-Seared Fish Fillet',
    description: 'Fresh catch fillet with lemon butter sauce and steamed greens.',
    price: 290.00,
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
    category: 'Main Dish',
  },
  // Desserts
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten center and ice cream.',
    price: 150.00,
    image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
    category: 'Desserts',
  },
  {
    name: 'Mango Sago',
    description: 'Chilled mango cream with sago pearls and fresh mango.',
    price: 110.00,
    image_url: 'https://images.unsplash.com/photo-1615478503562-ec2d8aa0e24e?w=400',
    category: 'Desserts',
  },
  {
    name: 'Crème Brûlée',
    description: 'Classic vanilla custard with a caramelized sugar crust.',
    price: 140.00,
    image_url: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400',
    category: 'Desserts',
  },
  // Drinks
  {
    name: 'Iced Tea',
    description: 'House-blend black tea served chilled over ice.',
    price: 60.00,
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    category: 'Drinks',
  },
  {
    name: 'Fresh Lemonade',
    description: 'Calamansi lemonade, lightly sweetened.',
    price: 80.00,
    image_url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400',
    category: 'Drinks',
  },
  {
    name: 'Brewed Coffee',
    description: 'Locally sourced beans, brewed fresh.',
    price: 70.00,
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    category: 'Drinks',
  },
];

async function seed() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('Connected to database. Seeding products...');

    await conn.execute('DELETE FROM order_items');
    await conn.execute('DELETE FROM orders');
    await conn.execute('DELETE FROM products');
    await conn.execute('ALTER TABLE products AUTO_INCREMENT = 1');

    for (const product of products) {
      await conn.execute(
        'INSERT INTO products (name, description, price, image_url, category, is_available) VALUES (?, ?, ?, ?, ?, 1)',
        [product.name, product.description, product.price, product.image_url, product.category]
      );
    }

    console.log(`Seeded ${products.length} products successfully.`);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

seed();
