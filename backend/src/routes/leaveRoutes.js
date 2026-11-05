const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
} = require('../controllers/leaveController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// Employee routes
router.post('/', protect, applyLeave);
router.get('/my-leaves', protect, getMyLeaves);

// Admin routes
router.get('/all', protect, requireAdmin, getAllLeaves);
router.put('/:id/review', protect, requireAdmin, reviewLeave);

module.exports = router;

