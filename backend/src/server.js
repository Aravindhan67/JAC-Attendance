const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const { sampleEmployees } = require('./seeds/seedData');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(async (isConnected) => {
  if (isConnected) {
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Init] No users found. Auto-seeding default Admin & Employees...');
        for (const emp of sampleEmployees) {
          const user = new User(emp);
          await user.save();
        }
        console.log('[Init] Default seed completed: Admin (admin@jacmedia.com / admin123)');
      }
    } catch (err) {
      console.warn('[Init] Auto-seed check error:', err.message);
    }
  }
});

// Middleware
app.use(cors());
// 20mb limit to handle camera snapshot uploads smoothly
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static route to serve uploaded verification photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'JAC Media Attendance API',
    time: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 JAC Media Attendance Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
