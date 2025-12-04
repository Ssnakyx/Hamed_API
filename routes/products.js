const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  const sort = (req.query.sort || 'created_at').replace('-', '');
  const desc = req.query.sort?.startsWith('-') ? 'DESC' : 'ASC';
  
  const filters = {};
  
  if (req.query.category) {
    filters.category_id = req.query.category;
  }
  if (req.query.minPrice !== undefined) {
    filters.min_price = parseFloat(req.query.minPrice);
  }
  if (req.query.maxPrice !== undefined) {
    filters.max_price = parseFloat(req.query.maxPrice);
  }
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (filters.category_id) {
    whereClause += ' AND p.category_id = ?';
    params.push(filters.category_id);
  }
  if (filters.min_price !== undefined) {
    whereClause += ' AND p.price >= ?';
    params.push(filters.min_price);
  }
  if (filters.max_price !== undefined) {
    whereClause += ' AND p.price <= ?';
    params.push(filters.max_price);
  }
  
  const countQuery = `SELECT COUNT(*) AS count FROM products p ${whereClause}`;
  const { count: total } = db.prepare(countQuery).get(...params);
  
  const productsQuery = `
    SELECT p.*, c.name AS category_name FROM products p 
    JOIN categories c ON c.id = p.category_id 
    ${whereClause}
    ORDER BY p.${sort === 'name' || sort === 'price' || sort === 'created_at' || sort === 'stock' ? sort : 'created_at'} ${desc}
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);
  const products = db.prepare(productsQuery).all(...params);

  res.json({
    data: products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    sort: { field: sort, order: desc === 'DESC' ? 'desc' : 'asc' },
    filters: req.query
  });
});

module.exports = router;
