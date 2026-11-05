const express = require('express');
const router = express.Router();
const {
  clockIn,
  clockOut,
  getTodayStatus,
  getMyHistory,
  getAllAttendance,
  getTodayFeed,
  updateAttendance,
} = require('../controllers/attendanceController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// Employee routes
router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);
router.get('/today', protect, getTodayStatus);
router.get('/my-history', protect, getMyHistory);

// Admin routes
router.get('/all', protect, requireAdmin, getAllAttendance);
router.get('/today-feed', protect, requireAdmin, getTodayFeed);
router.put('/:id', protect, requireAdmin, updateAttendance);

module.exports = router;

