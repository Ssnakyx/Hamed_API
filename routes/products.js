const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('./auth');

const ALLOWED_FILTERS = ['category', 'minPrice', 'maxPrice'];

router.get('/products', auth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const sortParam = req.query.sort || 'created_at';
  const desc = sortParam.startsWith('-');
  const sortField = desc ? sortParam.slice(1) : sortParam;
  const allowedSortFields = ['price', 'name', 'created_at'];
  const sort = allowedSortFields.includes(sortField) ? sortField : 'created_at';
  const order = desc ? 'DESC' : 'ASC';

  const filters = {};
  for (const key of ALLOWED_FILTERS) {
    if (req.query[key]) filters[key] = req.query[key];
  }

  const fields = req.query.fields ? req.query.fields.split(',') : null;
  const includeCategory = req.query.include === 'category';

  let whereClauses = [];
  let params = [];

  if (filters.category) {
    whereClauses.push('p.category_id = ?');
    params.push(filters.category);
  }
  if (filters.minPrice !== undefined) {
    whereClauses.push('p.price >= ?');
    params.push(parseFloat(filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    whereClauses.push('p.price <= ?');
    params.push(parseFloat(filters.maxPrice));
  }

  const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

  let countSql = `SELECT COUNT(*) as count FROM products p ${whereSQL}`;
  const total = db.prepare(countSql).get(...params).count;

  let selectFields = 'p.*';
  if (fields && fields.length > 0) {
    selectFields = fields.map(f => 'p.' + f).join(', ');
  }

  let sql = '';
  if (includeCategory) {
    sql = `
      SELECT ${selectFields}, c.id as category_id, c.name as category_name, c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSQL}
      ORDER BY p.${sort} ${order}
      LIMIT ? OFFSET ?
    `;
  } else {
    sql = `
      SELECT ${selectFields}
      FROM products p
      ${whereSQL}
      ORDER BY p.${sort} ${order}
      LIMIT ? OFFSET ?
    `;
  }

  params.push(limit, offset);
  let products = db.prepare(sql).all(...params);

  if (includeCategory) {
    products = products.map(p => {
      const { category_id, category_name, category_description, ...rest } = p;
      return {
        ...rest,
        category: {
          id: category_id,
          name: category_name,
          description: category_description
        }
      };
    });
  }

  res.json({
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    sort: { field: sort, order },
    filters
  });
});

module.exports = { auth, router };
module.exports = router;
