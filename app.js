const express = require('express');
const cors = require('cors');
const productsRouter = require('./routes/products');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', productsRouter);

app.listen(3000, () => console.log('http://localhost:3000'));
