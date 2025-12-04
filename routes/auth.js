const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const ACCESS_TOKEN = 'Token1';
const REFRESH_TOKEN = 'Token2';

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requis' });
  jwt.verify(token, ACCESS_TOKEN
  , (err, user) => {
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
  const accessToken = jwt.sign(payload, ACCESS_TOKEN
  , { expiresIn: '5m' });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN, { expiresIn: '5m' });
  db.prepare('INSERT OR REPLACE INTO refresh_tokens (token, user_id) VALUES (?, ?)').run(refreshToken, user.id);
  res.json({ 
    accessToken, 
    refreshToken,
    user: { id: user.id, email: user.email }
  });
});

router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  const storedToken = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(refreshToken);
  if (!storedToken) return res.status(403).json({ error: 'Refresh token invalide' });
  
  jwt.verify(refreshToken, REFRESH_TOKEN, (err, userPayload) => {
    if (err) {
      db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
      return res.status(403).json({ error: 'Refresh token expiré' });
    }
    const { iat, exp, ...user } = userPayload;
    
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    const newAccessToken = jwt.sign(user, ACCESS_TOKEN
    , { expiresIn: '5m' });
    const newRefreshToken = jwt.sign(user, REFRESH_TOKEN, { expiresIn: '5m' });
    db.prepare('INSERT INTO refresh_tokens (token, user_id) VALUES (?, ?)').run(newRefreshToken, user.id);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  });
});

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  res.json({ message: 'Déconnecté' });
});

router.get('/profile', auth, (req, res) => {
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

module.exports = router; 
module.exports.auth = auth; 
