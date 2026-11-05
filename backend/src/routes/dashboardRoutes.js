const express = require('express');
const router = express.Router();
const { getAdminDashboardStats } = require('../controllers/dashboardController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

router.get('/admin', protect, requireAdmin, getAdminDashboardStats);

module.exports = router;

