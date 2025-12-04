const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const ACCESS_TOKEN_SECRET = 'Token1';
const REFRESH_TOKEN_SECRET = 'Token2';
let refreshTokens = [];

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requis' });
  
  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
};

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Mauvais compte' });
  }
  
  const payload = { id: user.id, email: user.email };
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '5m' });
  
  refreshTokens.push(refreshToken);
  res.json({ 
    accessToken, 
    refreshToken,
    user: { id: user.id, email: user.email }
  });
});

router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ error: 'Token invalide' });
  }
  
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token expiré' });
    const newToken = jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
    res.json({ accessToken: newToken });
  });
});

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  refreshTokens = refreshTokens.filter(t => t !== refreshToken);
  res.json({ message: 'Déconnecté' });
});

router.get('/profile', auth, (req, res) => {
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

module.exports = router;
