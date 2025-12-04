const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const ACCESS_TOKEN_SECRET = 'Token1';
const REFRESH_TOKEN_SECRET = 'Token2';

let refreshTokens = []; 

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mdp' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'mauvais compte' });
  }

const userPayload = { 
  id: user.id, 
  email: user.email 

};

  const accessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, { 
    expiresIn: '100m'
  });
  
  const refreshToken = jwt.sign(userPayload, REFRESH_TOKEN_SECRET, { 
    expiresIn: '1d'
  });
  
  refreshTokens.push(refreshToken);
  res.json({ 
    accessToken, 
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  });
});

router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token requis' });
  }
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ error: 'Refresh token invalide' });
  }

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({ error: 'Refresh token expiré ou invalide' });
    }
    const newAccessToken = jwt.sign(userPayload, ACCESS_TOKEN_SECRET, { 
      expiresIn: '15m' 
    });
    
    res.json({ accessToken: newAccessToken });
  });
});
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token requis' });
  }
  
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);
  
  res.json({ message: 'deconnecter' });
});

module.exports = router;

