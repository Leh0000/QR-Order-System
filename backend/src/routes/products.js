const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/products — returns all available products with order counts
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT p.id, p.name, p.description, p.price, p.image_url, p.category,
            COALESCE(sales.units_sold, 0) AS units_sold
     FROM products p
     LEFT JOIN (
       SELECT oi.product_id, SUM(oi.quantity) AS units_sold
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE o.order_status != 'cancelled'
       GROUP BY oi.product_id
     ) sales ON sales.product_id = p.id
     WHERE p.is_available = 1
     ORDER BY p.category, p.id`
  );
  res.json({ data: rows });
}));

module.exports = router;
