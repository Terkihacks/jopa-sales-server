const express = require('express');
// const prisma = require('./src/prismaClient');
const cors = require('cors');

const productRoutes = require('./src/routes/productRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('v1/api/products', productRoutes);
app.use('v1/api/sales', salesRoutes);
app.use('v1/api/reports', reportRoutes);


// Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Test DB connection
  require('./src/config/config.js');
});