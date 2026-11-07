const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

const getTodayDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
};

// @desc Get Admin Dashboard Statistics
// @route GET /api/dashboard/admin
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const today = getTodayDateString();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // 1. Total Active Employees
    const totalEmployees = await User.countDocuments({ role: 'employee', status: 'active' });

    // 2. Today's Attendance
    const todayRecords = await Attendance.find({ date: today }).populate(
      'user',
      'name employeeId department designation profileImage shiftStartTime'
    );

    const presentCount = todayRecords.filter((r) => r.status === 'present').length;
    const lateCount = todayRecords.filter((r) => r.status === 'late').length;
    const halfDayCount = todayRecords.filter((r) => r.status === 'half-day').length;
    const totalClockedIn = todayRecords.length;

    // 3. Approved Leaves for Today
    const approvedLeavesToday = await Leave.countDocuments({
      status: 'approved',
      startDate: { $lte: todayDate },
      endDate: { $gte: todayDate },
    });

    // 4. Pending Leave Requests
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    // 5. Estimated Absent count
    const absentCount = Math.max(0, totalEmployees - totalClockedIn - approvedLeavesToday);

    // 6. Recent 8 check-ins
    const recentCheckIns = todayRecords.slice(0, 8);

    res.json({
      success: true,
      data: {
        totalEmployees,
        presentCount,
        lateCount,
        halfDayCount,
        onLeaveCount: approvedLeavesToday,
        absentCount,
        pendingLeaves,
        totalClockedIn,
        attendanceRate: totalEmployees > 0 ? Math.round((totalClockedIn / totalEmployees) * 100) : 0,
        recentCheckIns,
        today,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

