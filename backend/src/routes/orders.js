const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { rateLimit } = require('../middleware/rateLimit');
const { addClient, removeClient, notifyOrdersChanged } = require('../orderEvents');

const postOrderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyFn: (req) => `table:${req.body?.table_number ?? req.ip}`,
});

const TAX_RATE = parseFloat(process.env.TAX_RATE || '0.12');

const VALID_ORDER_STATUSES = ['received', 'preparing', 'ready', 'completed', 'cancelled'];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

function withOrderNumbers(orders) {
  const sorted = [...orders].sort((a, b) => {
    const timeDiff = new Date(a.created_at) - new Date(b.created_at);
    if (timeDiff !== 0) return timeDiff;
    return a.id - b.id;
  });
  const numberById = new Map(sorted.map((o, i) => [o.id, i + 1]));
  return orders.map((o) => ({ ...o, order_number: numberById.get(o.id) }));
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

    const result = withOrderNumbers(
      orders.map((o) => ({
        ...o,
        items: itemsByOrder[o.id] || [],
      }))
    );

    res.json({ data: result });
  })
);

// GET /api/orders/events — SSE stream for admin order updates
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  addClient(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  req.on('close', () => {
    removeClient(res);
  });
});

// POST /api/orders — create a new order
router.post(
  '/',
  postOrderLimiter,
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
      .isIn(['gcash', 'card'])
      .withMessage('payment_method must be gcash or card'),
    body('notes').optional().isString().trim().isLength({ max: 500 }),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { table_number, items, payment_method = 'gcash', notes = '' } = req.body;

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
         VALUES (?, ?, ?, ?, 'paid', 'received', ?)`,
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

      const [[{ order_number }]] = await conn.execute(
        'SELECT COUNT(*) AS order_number FROM orders'
      );

      notifyOrdersChanged('created');

      res.status(201).json({
        data: {
          order_number,
          table_number,
          subtotal,
          tax,
          total,
          payment_method,
          payment_status: 'paid',
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

// PATCH /api/orders/:id — update order_status only (payment is set at checkout)
router.patch(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid order id'),
    body('order_status')
      .isIn(VALID_ORDER_STATUSES)
      .withMessage(`order_status must be one of: ${VALID_ORDER_STATUSES.join(', ')}`),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { order_status } = req.body;

    const fields = ['order_status = ?'];
    const values = [order_status];
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
    notifyOrdersChanged('updated');
    res.json({ data: rows[0] });
  })
);

// DELETE /api/orders/:id — permanently remove an order and its items
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid order id')],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    notifyOrdersChanged('deleted');
    res.json({ data: { id: Number(id), deleted: true } });
  })
);

module.exports = router;
