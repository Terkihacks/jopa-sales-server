const express = require('express');
// const prisma = require('./src/prismaClient');
const cors = require('cors');
const scheduleDailyReport = require('./src/jobs/reportJob.js');

const productRoutes = require('./src/routes/productRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const adminDashboard = require('./src/routes/adminDashboard.js')
const authRoutes = require('./src/routes/authRoutes.js');
const userRoutes = require('./src/routes/userRoute.js');

const app = express();
app.use(cors(
  // {
  //   origin: ["https://jopa-sales-hub.vercel.app"],
  //   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  //   allowedHeaders: ["Content-Type", "Authorization"],
  //   credentials: true,
  // }
));
app.use(express.json());

app.use('/v1/api/products', productRoutes);
app.use('/v1/api/auth', authRoutes);
app.use('/v1/api/sales', salesRoutes);
app.use('/v1/api/users', userRoutes) ;
app.use('/v1/api/reports', reportRoutes);
app.use('/v1/api', adminDashboard);


app.get('/', (req, res) => {
  res.send('Server is running and cron jobs are active 🚀');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start cron job
scheduleDailyReport();

// Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Test DB connection
  require('./src/config/config.js');
});
/* 
http://localhost:4000/v1/api/reports/getreports
curl.exe -I http://jopasales.alxtexh.top/v1/api/admin-dashboard
https://jopasales.alxtexh.top/v1/api/admin-dashboard
http://localhost:4000/v1/api/admin-dashboard
http://localhost:4000/v1/api/products/get-products
http://localhost:4000/v1/api/auth/record-keepers/login
http://localhost:4000/v1/api/auth/admin-login
https://jopasales.alxtexh.top/v1/api/auth/admin-login
http://localhost:4000/v1/api/auth/register-user
http://localhost:4000/v1/api/sales/create-sale
http://localhost:4000/v1/api/sales/get-sales-by-user/
http://localhost:4000/v1/api/sales/get-sales
http://localhost:4000/v1/api/users/get-users
*/

