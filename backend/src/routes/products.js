const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/products — returns all available products
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, description, price, image_url, category FROM products WHERE is_available = 1 ORDER BY category, id'
  );
  res.json({ data: rows });
}));

module.exports = router;
