const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/products', (req, res) => {
  const ALLOWED_FILTERS = ['category', 'minPrice', 'maxPrice'];
  const invalidFilters = Object.keys(req.query).filter(key => 
    !['page', 'limit', 'sort', 'include', 'fields'].includes(key) && 
    !ALLOWED_FILTERS.includes(key)
  );
  
  if (invalidFilters.length > 0) {
    return res.status(400).json({ 
      error: `Filtres non invalide : ${invalidFilters.join(', ')}. ` +
             `Champs valide : ${ALLOWED_FILTERS.join(', ')}` 
    });
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const sort = (req.query.sort || 'created_at').replace('-', '');
  const desc = req.query.sort?.startsWith('-') ? 'DESC' : 'ASC';
  const includeCategory = req.query.include === 'category';

  const filters = {};
  if (req.query.category) filters.category_id = req.query.category;
  if (req.query.minPrice !== undefined) filters.min_price = parseFloat(req.query.minPrice);
  if (req.query.maxPrice !== undefined) filters.max_price = parseFloat(req.query.maxPrice);

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

  let productsQuery;
  if (includeCategory) {
    productsQuery = `
      SELECT p.*, c.id as category_id, c.name AS category_name, c.description AS category_description 
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ${whereClause}
      ORDER BY p.${sort === 'name' || sort === 'price' || sort === 'created_at' || sort === 'stock' ? sort : 'created_at'} ${desc}
      LIMIT ? OFFSET ?
    `;
  } else {
    productsQuery = `
      SELECT p.* FROM products p
      ${whereClause}
      ORDER BY p.${sort === 'name' || sort === 'price' || sort === 'created_at' || sort === 'stock' ? sort : 'created_at'} ${desc}
      LIMIT ? OFFSET ?
    `;
  }

  params.push(limit, offset);
  let products = db.prepare(productsQuery).all(...params);
  if (includeCategory) {
    products = products.map(product => ({
      ...product,
      category: {
        id: product.category_id,
        name: product.category_name,
        description: product.category_description
      }
    }));
    products.forEach(product => {
      delete product.category_id;
      delete product.category_name;
      delete product.category_description;
    });
  }

  res.json({
    data: products,
    pagination: { 
      page, limit, total, 
      totalPages: Math.ceil(total / limit), 
      hasNext: page * limit < total, 
      hasPrev: page > 1 
    },
    sort: { field: sort, order: desc === 'DESC' ? 'desc' : 'asc' },
    filters: req.query
  });
});

module.exports = router;

