const Leave = require('../models/Leave');
const User = require('../models/User');

// Monthly Leave Limits (Refreshes on the 1st of every calendar month)
const MONTHLY_LEAVE_LIMITS = {
  'Casual Leave': 1,
  'Sick Leave': 2,
  'Emergency Leave': 1,
};

// Helper: Calculate number of days in a specific year and month between two dates (inclusive)
const getDaysInMonth = (startDate, endDate, targetYear, targetMonth) => {
  let count = 0;
  const current = new Date(startDate);
  const last = new Date(endDate);
  current.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);

  while (current <= last) {
    if (current.getFullYear() === targetYear && current.getMonth() === targetMonth) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// @desc Apply for leave with monthly quota enforcement
// @route POST /api/leaves
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide start date, end date, and reason' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    // Calculate total days difference (inclusive)
    const diffTime = Math.abs(end - start);
    const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const selectedType = leaveType || 'Casual Leave';

    // Enforce Monthly Leave Quotas (1 Casual, 2 Sick, 1 Emergency)
    const monthlyLimit = MONTHLY_LEAVE_LIMITS[selectedType];
    if (monthlyLimit !== undefined) {
      // Find all distinct months spanned by this leave
      const monthsToCheck = new Set();
      const cursor = new Date(start);
      while (cursor <= end) {
        monthsToCheck.add(`${cursor.getFullYear()}-${cursor.getMonth()}`);
        cursor.setDate(cursor.getDate() + 1);
      }

      for (const ym of monthsToCheck) {
        const [year, month] = ym.split('-').map(Number);
        const requestedDaysInMonth = getDaysInMonth(start, end, year, month);
        const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

        // Single application cannot exceed monthly limit
        if (requestedDaysInMonth > monthlyLimit) {
          return res.status(400).json({
            success: false,
            message: `Monthly limit exceeded: You can only take up to ${monthlyLimit} day(s) of ${selectedType} in ${monthName}. You requested ${requestedDaysInMonth} day(s).`,
          });
        }

        // Query active leaves (pending + approved) for this user in this month
        const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const existingLeaves = await Leave.find({
          user: req.user._id,
          leaveType: selectedType,
          status: { $ne: 'rejected' },
          startDate: { $lte: endOfMonth },
          endDate: { $gte: startOfMonth },
        });

        let usedDaysInMonth = 0;
        for (const el of existingLeaves) {
          usedDaysInMonth += getDaysInMonth(new Date(el.startDate), new Date(el.endDate), year, month);
        }

        if (usedDaysInMonth + requestedDaysInMonth > monthlyLimit) {
          const remaining = Math.max(0, monthlyLimit - usedDaysInMonth);
          return res.status(400).json({
            success: false,
            message: `Monthly quota exceeded for ${selectedType} in ${monthName}. Limit: ${monthlyLimit} day(s)/month. Used/Pending: ${usedDaysInMonth} day(s). Remaining: ${remaining} day(s). Allowance refreshes on the 1st of next month.`,
          });
        }
      }
    }

    const leave = new Leave({
      user: req.user._id,
      leaveType: selectedType,
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

// @desc Get logged-in user's leaves & monthly quota balances
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

    // Calculate current month's leave quota balance
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const thisMonthLeaves = leaves.filter(
      (l) => l.status !== 'rejected' && new Date(l.startDate) <= endOfMonth && new Date(l.endDate) >= startOfMonth
    );

    const monthlyQuotas = {};
    for (const [type, limit] of Object.entries(MONTHLY_LEAVE_LIMITS)) {
      const typeLeaves = thisMonthLeaves.filter((l) => l.leaveType === type);
      let used = 0;
      for (const l of typeLeaves) {
        used += getDaysInMonth(new Date(l.startDate), new Date(l.endDate), currentYear, currentMonth);
      }
      monthlyQuotas[type] = {
        limit,
        used,
        remaining: Math.max(0, limit - used),
      };
    }

    const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    res.json({
      success: true,
      data: leaves,
      stats,
      monthlyQuota: {
        month: monthName,
        quotas: monthlyQuotas,
      },
    });
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

