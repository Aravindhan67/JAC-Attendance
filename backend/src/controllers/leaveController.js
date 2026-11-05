const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc Apply for leave
// @route POST /api/leaves
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide start date, end date, and reason' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    // Calculate days difference (inclusive)
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = new Leave({
      user: req.user._id,
      leaveType: leaveType || 'Casual Leave',
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: 'pending',
    });

    await leave.save();

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get logged-in user's leaves
// @route GET /api/leaves/my-leaves
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id }).sort({ createdAt: -1 });

    const stats = {
      pending: leaves.filter((l) => l.status === 'pending').length,
      approved: leaves.filter((l) => l.status === 'approved').length,
      rejected: leaves.filter((l) => l.status === 'rejected').length,
      totalDaysApproved: leaves
        .filter((l) => l.status === 'approved')
        .reduce((sum, l) => sum + l.totalDays, 0),
    };

    res.json({ success: true, data: leaves, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Get all leave requests
// @route GET /api/leaves/all
exports.getAllLeaves = async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    let leaves = await Leave.find(filter)
      .populate('user', 'name employeeId department designation profileImage email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    if (department && department !== 'All') {
      leaves = leaves.filter((l) => l.user && l.user.department === department);
    }

    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Review leave request (Approve / Reject)
// @route PUT /api/leaves/:id/review
exports.reviewLeave = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'" });
    }

    const leave = await Leave.findById(req.params.id).populate('user', 'name email employeeId');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    leave.status = status;
    leave.adminRemarks = adminRemarks || '';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();

    await leave.save();

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

