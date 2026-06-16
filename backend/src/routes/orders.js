const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.12');

const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const VALID_ORDER_STATUSES = ['received', 'preparing', 'ready', 'completed', 'cancelled'];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

// GET /api/orders — list all orders with items
router.get(
  '/',
  [query('status').optional().isIn(VALID_ORDER_STATUSES)],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { status } = req.query;

    let ordersQuery = `
      SELECT id, table_number, subtotal, tax, total,
             payment_status, order_status, notes, created_at, updated_at
      FROM orders
    `;
    const params = [];
    if (status) {
      ordersQuery += ' WHERE order_status = ?';
      params.push(status);
    }
    ordersQuery += ' ORDER BY created_at DESC';

    const [orders] = await pool.execute(ordersQuery, params);

    if (orders.length === 0) {
      return res.json({ data: [] });
    }

    const orderIds = orders.map((o) => o.id);
    const placeholders = orderIds.map(() => '?').join(', ');
    const [items] = await pool.execute(
      `SELECT id, order_id, product_id, product_name, unit_price, quantity, line_total
       FROM order_items WHERE order_id IN (${placeholders})`,
      orderIds
    );

    const itemsByOrder = {};
    for (const item of items) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }

    const result = orders.map((o) => ({
      ...o,
      items: itemsByOrder[o.id] || [],
    }));

    res.json({ data: result });
  })
);

// POST /api/orders — create a new order
router.post(
  '/',
  [
    body('table_number')
      .isInt({ min: 1, max: 99 })
      .withMessage('table_number must be an integer between 1 and 99'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('items must be a non-empty array'),
    body('items.*.product_id')
      .isInt({ min: 1 })
      .withMessage('Each item must have a valid product_id'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Each item quantity must be at least 1'),
    body('payment_method')
      .optional()
      .isIn(['cash', 'gcash', 'card'])
      .withMessage('payment_method must be cash, gcash, or card'),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { table_number, items, payment_method = 'cash', notes = '' } = req.body;

    const productIds = items.map((i) => i.product_id);
    const placeholders = productIds.map(() => '?').join(', ');
    const [products] = await pool.execute(
      `SELECT id, name, price FROM products WHERE id IN (${placeholders}) AND is_available = 1`,
      productIds
    );

    const productMap = {};
    for (const p of products) productMap[p.id] = p;

    for (const item of items) {
      if (!productMap[item.product_id]) {
        return res.status(422).json({
          error: `Product id ${item.product_id} not found or unavailable`,
        });
      }
    }

    let subtotal = 0;
    const orderLines = items.map((item) => {
      const product = productMap[item.product_id];
      const lineTotal = parseFloat(product.price) * item.quantity;
      subtotal += lineTotal;
      return {
        product_id: product.id,
        product_name: product.name,
        unit_price: parseFloat(product.price),
        quantity: item.quantity,
        line_total: lineTotal,
      };
    });

    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));
    subtotal = parseFloat(subtotal.toFixed(2));

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [orderResult] = await conn.execute(
        `INSERT INTO orders (table_number, subtotal, tax, total, payment_status, order_status, notes)
         VALUES (?, ?, ?, ?, 'pending', 'received', ?)`,
        [table_number, subtotal, tax, total, notes]
      );
      const orderId = orderResult.insertId;

      for (const line of orderLines) {
        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, line.product_id, line.product_name, line.unit_price, line.quantity, line.line_total]
        );
      }

      await conn.commit();

      res.status(201).json({
        data: {
          order_id: orderId,
          table_number,
          subtotal,
          tax,
          total,
          payment_method,
          order_status: 'received',
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  })
);

// PATCH /api/orders/:id — update payment_status or order_status
router.patch(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid order id'),
    body('payment_status')
      .optional()
      .isIn(VALID_PAYMENT_STATUSES)
      .withMessage(`payment_status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`),
    body('order_status')
      .optional()
      .isIn(VALID_ORDER_STATUSES)
      .withMessage(`order_status must be one of: ${VALID_ORDER_STATUSES.join(', ')}`),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { payment_status, order_status } = req.body;

    if (!payment_status && !order_status) {
      return res.status(422).json({ error: 'Provide payment_status or order_status to update' });
    }

    const fields = [];
    const values = [];
    if (payment_status) { fields.push('payment_status = ?'); values.push(payment_status); }
    if (order_status) { fields.push('order_status = ?'); values.push(order_status); }
    values.push(id);

    const [result] = await pool.execute(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [rows] = await pool.execute(
      'SELECT id, table_number, payment_status, order_status, updated_at FROM orders WHERE id = ?',
      [id]
    );
    res.json({ data: rows[0] });
  })
);

module.exports = router;
