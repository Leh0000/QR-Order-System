require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../src/config/db');

const products = [
  // Appetizers
  {
    name: 'Crispy Spring Rolls',
    description: 'Hand-rolled vegetable spring rolls with sweet chili dip.',
    price: 120.00,
    image_url: 'https://images.unsplash.com/photo-1747045142479-8c29f86307cd?w=400',
    category: 'Appetizers',
  },
  {
    name: 'Garlic Herb Bread',
    description: 'Toasted baguette with roasted garlic butter and herbs.',
    price: 95.00,
    image_url: 'https://images.unsplash.com/photo-1751199592465-f142293a8cc6?w=400',
    category: 'Appetizers',
  },
  {
    name: 'Calamares',
    description: 'Lightly battered squid rings with spiced vinegar.',
    price: 160.00,
    image_url: 'https://images.unsplash.com/photo-1746135220790-b597f6ae3a9a?w=400',
    category: 'Appetizers',
  },
  // Main Dish
  {
    name: 'Grilled Chicken Inasal',
    description: 'Charcoal-grilled chicken marinated in calamansi and lemongrass.',
    price: 280.00,
    image_url: 'https://images.unsplash.com/photo-1753988059147-519073e45402?w=400',
    category: 'Main Dish',
  },
  {
    name: 'Beef Stir Fry',
    description: 'Tender beef strips wok-tossed with peppers in oyster sauce.',
    price: 320.00,
    image_url: 'https://images.unsplash.com/photo-1767429012942-b707f5a8b704?w=400',
    category: 'Main Dish',
  },
  {
    name: 'Pasta Carbonara',
    description: 'Creamy egg-based pasta with smoked bacon and parmesan.',
    price: 260.00,
    image_url: 'https://images.unsplash.com/photo-1633337474564-1d9478ca4e2e?w=400',
    category: 'Main Dish',
  },
  {
    name: 'Pan-Seared Fish Fillet',
    description: 'Fresh catch fillet with lemon butter sauce and steamed greens.',
    price: 290.00,
    image_url: 'https://images.unsplash.com/photo-1680405104108-a249b7c3ddf9?w=400',
    category: 'Main Dish',
  },
  // Desserts
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten center and ice cream.',
    price: 150.00,
    image_url: 'https://images.unsplash.com/photo-1673551490812-eaee2e9bf0ef?w=400',
    category: 'Desserts',
  },
  {
    name: 'Mango Sago',
    description: 'Chilled mango cream with sago pearls and fresh mango.',
    price: 110.00,
    image_url: 'https://images.unsplash.com/photo-1589970343009-c6147c707b3d?w=400',
    category: 'Desserts',
  },
  {
    name: 'Crème Brûlée',
    description: 'Classic vanilla custard with a caramelized sugar crust.',
    price: 140.00,
    image_url: 'https://images.unsplash.com/photo-1432139438709-ee8369449944?w=400',
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
    image_url: 'https://images.unsplash.com/photo-1623157980612-da2c2cdb4c0b?w=400',
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
