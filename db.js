const Database = require('better-sqlite3');
const db = new Database('store.db');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL, 
    stock INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    category_id INTEGER REFERENCES categories(id)
  );
`);

[['Électronique', 'Appareils'], ['Vêtements', 'Mode'], ['Maison', 'Décoration']]
  .forEach(([name, desc]) => db.prepare('INSERT OR IGNORE INTO categories VALUES (NULL, ?, ?)').run(name, desc));

[
  ['Google Pixel 8 Pro', 999.99, 28, 1], ['Sony WH-1000XM5', 399.99, 40, 1], ['iPad Mini 6', 649.99, 18, 1],
  ['SSD Samsung 990 Pro 1TB', 149.99, 60, 1], ['Casque HyperX Cloud III', 129.99, 50, 1], ['Manette Xbox Elite Series 2', 179.99, 25, 1],
  ['Ecran LG UltraGear 27"', 349.99, 22, 1], ['Routeur WiFi 6 TP-Link', 129.99, 35, 1], ['Clé USB 256 Go Sandisk', 39.99, 120, 1],
  ['Batterie externe Anker 20k mAh', 49.99, 90, 1], ['Sweat à capuche Champion', 59.99, 70, 2], ['Polo Lacoste classique', 89.99, 50, 2],
  ['Baskets Puma RS-X', 129.99, 40, 2],  ['Montre Casio G-Shock', 99.99, 55, 2],
  ['Sac à dos Herschel', 69.99, 45, 2], ['Veste en jean Wrangler', 79.99, 38, 2], ['Lunettes de soleil Ray-Ban', 149.99, 30, 2],
  ['Ceinture en cuir Fossil', 39.99, 65, 2], ['Écharpe en laine Mango', 29.99, 90, 2], ['Aspirateur Dyson V12', 549.99, 12, 3],
  ['Plaid en fausse fourrure', 34.99, 60, 3], ['Table basse scandinave', 159.99, 14, 3], ['Bougie parfumée Yankee Candle', 29.99, 100, 3],
  ['Ventilateur sur pied Rowenta', 89.99, 30, 3], ['Set de verres transparents (6x)', 24.99, 80, 3], ['Machine à pain Moulinex', 129.99, 20, 3],
  ['Miroir mural rond 70cm', 79.99, 25, 3], ['Plaque induction portable', 59.99, 35, 3], ['Tondeuse à barbe Philips OneBlade', 39.99, 55, 3]
].forEach(([name, price, stock, catId]) => 
  db.prepare('INSERT OR IGNORE INTO products VALUES (NULL, ?, ?, ?, CURRENT_TIMESTAMP, ?)').run(name, price, stock, catId)
);

module.exports = db;
