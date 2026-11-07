const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { saveBase64Image } = require('../utils/photoStorage');

// Timezone and Cutoff Rules (Asia/Kolkata, UTC+05:30)
const TIMEZONE = 'Asia/Kolkata';

// Helper to get local date string YYYY-MM-DD in Asia/Kolkata
const getTodayDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(date);
};

// Helper to get current minutes from midnight in Asia/Kolkata
const getLocalTimeParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);
  const totalMinutes = hour * 60 + minute;

  return { hour, minute, second, totalMinutes };
};

// Cutoff limits:
// Check-in NOT allowed after 09:45 AM (9 * 60 + 45 = 585 minutes) unless using Late/Forgot Check-in allowance
const CLOCK_IN_CUTOFF_MINUTES = 9 * 60 + 45; // 09:45 AM
// Check-out NOT allowed after 07:00 PM (19 * 60 = 1140 minutes) unless using Forgot Check-out allowance
const CLOCK_OUT_CUTOFF_MINUTES = 19 * 60; // 07:00 PM (19:00)

// Monthly Limit for Late Check-In & Forgot Check-In (3 per month, auto-refreshes on 1st of every month)
const MONTHLY_EXCEPTION_LIMIT = 3;

// Helper: Count how many times user used Late/Forgot punch allowance in current calendar month
const getMonthlyExceptionsUsed = async (userId, targetDate = new Date()) => {
  const yearMonth = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE })
    .format(targetDate)
    .slice(0, 7); // "YYYY-MM"

  const count = await Attendance.countDocuments({
    user: userId,
    date: { $regex: `^${yearMonth}` },
    $or: [
      { exceptionType: { $in: ['Late Check-In', 'Forgot Check-In', 'Forgot Check-Out'] } },
      { 'clockIn.punchType': { $in: ['Late Check-In', 'Forgot Check-In'] } },
      { 'clockOut.punchType': { $in: ['Forgot Check-Out'] } },
    ],
  });

  return count;
};

// @desc Clock In with photo capture & 3/month Late/Forgot punch allowance
// @route POST /api/attendance/clock-in
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photo, note, location, punchType } = req.body;

    const { totalMinutes } = getLocalTimeParts();
    const isPastCutoff = totalMinutes > CLOCK_IN_CUTOFF_MINUTES;

    const usedExceptions = await getMonthlyExceptionsUsed(userId);
    const remainingExceptions = Math.max(0, MONTHLY_EXCEPTION_LIMIT - usedExceptions);

    let effectivePunchType = punchType || 'Regular';
    let exceptionType = 'none';

    // If past 09:45 AM cutoff, check-in requires a monthly Late or Forgot Check-In allowance
    if (isPastCutoff) {
      if (remainingExceptions <= 0) {
        const formattedCurrentTime = new Intl.DateTimeFormat('en-IN', {
          timeZone: TIMEZONE,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(new Date());

        return res.status(403).json({
          success: false,
          message: `Monthly allowance exhausted: You have used all 3 Late / Forgot Check-in allowances for this month. Check-in after 09:45 AM is closed (Current: ${formattedCurrentTime}). Allowance refreshes on the 1st of next month. Please contact Admin.`,
        });
      }

      effectivePunchType = punchType === 'Forgot Check-In' ? 'Forgot Check-In' : 'Late Check-In';
      exceptionType = effectivePunchType;
    } else if (punchType === 'Late Check-In' || punchType === 'Forgot Check-In') {
      // Explicitly filed as exception
      if (remainingExceptions <= 0) {
        return res.status(403).json({
          success: false,
          message: `Monthly allowance exhausted: You have used all 3 Late / Forgot Check-in allowances for this month. Allowance refreshes next month.`,
        });
      }
      effectivePunchType = punchType;
      exceptionType = punchType;
    }

    if (!photo) {
      return res.status(400).json({ success: false, message: 'Photo verification is required to Clock In' });
    }

    const today = getTodayDateString();
    let record = await Attendance.findOne({ user: userId, date: today });

    if (record && record.clockIn && record.clockIn.timestamp) {
      return res.status(400).json({ success: false, message: 'You have already clocked in today' });
    }

    // Save photo
    const photoPath = saveBase64Image(photo, `clockin-${req.user.employeeId}`);

    const now = new Date();
    // Calculate if late: Standard shift is 09:30 AM
    let status = 'present';
    const shiftTime = req.user.shiftStartTime || '09:30';
    const [shiftHour, shiftMin] = shiftTime.split(':').map(Number);
    const standardStartMinutes = shiftHour * 60 + shiftMin;

    if (totalMinutes > standardStartMinutes || exceptionType !== 'none') {
      status = 'late';
    }

    const clockInData = {
      timestamp: now,
      photo: photoPath,
      note: note || (exceptionType !== 'none' ? `${exceptionType} recorded` : ''),
      location: location || 'Office',
      punchType: effectivePunchType,
    };

    if (!record) {
      record = new Attendance({
        user: userId,
        date: today,
        clockIn: clockInData,
        status,
        exceptionType,
      });
    } else {
      record.clockIn = clockInData;
      record.status = status;
      record.exceptionType = exceptionType;
    }

    await record.save();

    const newRemaining = exceptionType !== 'none' ? remainingExceptions - 1 : remainingExceptions;
    let message = `Clocked in successfully at ${now.toLocaleTimeString('en-IN', { timeZone: TIMEZONE })}`;
    if (exceptionType !== 'none') {
      message += ` (${exceptionType} applied • ${newRemaining} of ${MONTHLY_EXCEPTION_LIMIT} monthly allowances left)`;
    }

    res.status(200).json({
      success: true,
      message,
      data: record,
      exceptionQuota: {
        limit: MONTHLY_EXCEPTION_LIMIT,
        used: MONTHLY_EXCEPTION_LIMIT - newRemaining,
        remaining: newRemaining,
      },
    });
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ success: false, message: 'Server error during clock in', error: error.message });
  }
};

// @desc Clock Out with photo capture & Forgot Check-out allowance
// @route POST /api/attendance/clock-out
exports.clockOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photo, note, location, punchType } = req.body;

    const { totalMinutes } = getLocalTimeParts();
    const isPastCutoff = totalMinutes > CLOCK_OUT_CUTOFF_MINUTES;

    const usedExceptions = await getMonthlyExceptionsUsed(userId);
    const remainingExceptions = Math.max(0, MONTHLY_EXCEPTION_LIMIT - usedExceptions);

    let effectivePunchType = punchType || 'Regular';
    let isException = false;

    // Enforce Rule: Check-out after 07:00 PM requires Forgot Check-Out exception allowance
    if (isPastCutoff) {
      if (remainingExceptions <= 0) {
        const formattedCurrentTime = new Intl.DateTimeFormat('en-IN', {
          timeZone: TIMEZONE,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(new Date());

        return res.status(403).json({
          success: false,
          message: `Monthly allowance exhausted: You have used all 3 Late / Forgot punch allowances for this month. Check-out after 07:00 PM is closed (Current: ${formattedCurrentTime}). Allowance refreshes on the 1st of next month. Please contact Admin or HR.`,
        });
      }
      effectivePunchType = 'Forgot Check-Out';
      isException = true;
    }

    if (!photo) {
      return res.status(400).json({ success: false, message: 'Photo verification is required to Clock Out' });
    }

    const today = getTodayDateString();
    const record = await Attendance.findOne({ user: userId, date: today });

    if (!record || !record.clockIn || !record.clockIn.timestamp) {
      return res.status(400).json({ success: false, message: 'You have not clocked in yet today' });
    }

    if (record.clockOut && record.clockOut.timestamp) {
      return res.status(400).json({ success: false, message: 'You have already clocked out today' });
    }

    const photoPath = saveBase64Image(photo, `clockout-${req.user.employeeId}`);
    const now = new Date();

    // Calculate total hours
    const clockInTime = new Date(record.clockIn.timestamp);
    const diffMs = now - clockInTime;
    const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    record.clockOut = {
      timestamp: now,
      photo: photoPath,
      note: note || (isException ? 'Forgot Check-Out recorded' : ''),
      location: location || 'Office',
      punchType: effectivePunchType,
    };
    record.totalHours = totalHours;

    if (isException && (!record.exceptionType || record.exceptionType === 'none')) {
      record.exceptionType = 'Forgot Check-Out';
    }

    // If worked less than 4.5 hours, mark as half-day unless already marked late
    if (totalHours < 4.5 && record.status === 'present') {
      record.status = 'half-day';
    }

    await record.save();

    const newRemaining = isException ? remainingExceptions - 1 : remainingExceptions;
    let message = `Clocked out successfully at ${now.toLocaleTimeString('en-IN', { timeZone: TIMEZONE })}. Total hours: ${totalHours} hrs`;
    if (isException) {
      message += ` (Forgot Check-Out applied • ${newRemaining} of ${MONTHLY_EXCEPTION_LIMIT} monthly allowances left)`;
    }

    res.status(200).json({
      success: true,
      message,
      data: record,
      exceptionQuota: {
        limit: MONTHLY_EXCEPTION_LIMIT,
        used: MONTHLY_EXCEPTION_LIMIT - newRemaining,
        remaining: newRemaining,
      },
    });
  } catch (error) {
    console.error('Clock-out error:', error);
    res.status(500).json({ success: false, message: 'Server error during clock out', error: error.message });
  }
};

// @desc Get Today's attendance status & exception quota balance
// @route GET /api/attendance/today
exports.getTodayStatus = async (req, res) => {
  try {
    const today = getTodayDateString();
    const record = await Attendance.findOne({ user: req.user._id, date: today });
    const { totalMinutes } = getLocalTimeParts();

    const usedExceptions = await getMonthlyExceptionsUsed(req.user._id);
    const remainingExceptions = Math.max(0, MONTHLY_EXCEPTION_LIMIT - usedExceptions);

    const isPastCheckInCutoff = totalMinutes > CLOCK_IN_CUTOFF_MINUTES;
    const isPastCheckOutCutoff = totalMinutes > CLOCK_OUT_CUTOFF_MINUTES;

    const isCheckInLocked = isPastCheckInCutoff && remainingExceptions <= 0;
    const isCheckOutLocked = isPastCheckOutCutoff && remainingExceptions <= 0;

    const now = new Date();
    const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    res.json({
      success: true,
      data: record || null,
      serverTime: new Date(),
      rules: {
        checkInCutoff: '09:45 AM',
        checkOutCutoff: '07:00 PM',
        isPastCheckInCutoff,
        isPastCheckOutCutoff,
        isCheckInLocked,
        isCheckOutLocked,
      },
      exceptionQuota: {
        limit: MONTHLY_EXCEPTION_LIMIT,
        used: usedExceptions,
        remaining: remainingExceptions,
        month: monthName,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get user's own attendance history
// @route GET /api/attendance/my-history
exports.getMyHistory = async (req, res) => {
  try {
    const { month, year } = req.query; // YYYY-MM or optional month/year
    const query = { user: req.user._id };

    if (month && year) {
      const monthPadded = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${monthPadded}` };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    // Calculate quick stats
    const totalPresent = records.filter((r) => r.status === 'present').length;
    const totalLate = records.filter((r) => r.status === 'late').length;
    const totalHalfDay = records.filter((r) => r.status === 'half-day').length;
    const totalHours = records.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
    const totalExceptions = records.filter(
      (r) =>
        r.exceptionType === 'Late Check-In' ||
        r.exceptionType === 'Forgot Check-In' ||
        r.exceptionType === 'Forgot Check-Out' ||
        r.clockIn?.punchType === 'Late Check-In' ||
        r.clockIn?.punchType === 'Forgot Check-In' ||
        r.clockOut?.punchType === 'Forgot Check-Out'
    ).length;

    res.json({
      success: true,
      data: records,
      stats: {
        totalDays: records.length,
        totalPresent,
        totalLate,
        totalHalfDay,
        totalExceptions,
        totalHours: Math.round(totalHours * 10) / 10,
      },
      exceptionQuota: {
        limit: MONTHLY_EXCEPTION_LIMIT,
        used: totalExceptions,
        remaining: Math.max(0, MONTHLY_EXCEPTION_LIMIT - totalExceptions),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Get all attendance records with filtering
// @route GET /api/attendance/all
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, month, department, employeeId, status } = req.query;
    const filter = {};

    if (date) {
      filter.date = date;
    } else if (month) {
      filter.date = { $regex: `^${month}` }; // e.g. "2026-11"
    }

    if (status) {
      filter.status = status;
    }

    // Populate user
    let records = await Attendance.find(filter)
      .populate('user', 'name employeeId email department designation profileImage shiftStartTime')
      .sort({ date: -1, 'clockIn.timestamp': -1 });

    // Filter by department or employeeId if provided
    if (department && department !== 'All') {
      records = records.filter((r) => r.user && r.user.department === department);
    }
    if (employeeId) {
      records = records.filter((r) => r.user && r.user.employeeId.toLowerCase().includes(employeeId.toLowerCase()));
    }

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Get live today feed (all employee check-ins for today with photos)
// @route GET /api/attendance/today-feed
exports.getTodayFeed = async (req, res) => {
  try {
    const today = getTodayDateString();
    const records = await Attendance.find({ date: today })
      .populate('user', 'name employeeId department designation profileImage')
      .sort({ 'clockIn.timestamp': -1 });

    res.json({ success: true, data: records, date: today });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Update attendance record manually
// @route PUT /api/attendance/:id
exports.updateAttendance = async (req, res) => {
  try {
    const { status, adminRemark, totalHours } = req.body;
    const record = await Attendance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    if (status) record.status = status;
    if (adminRemark !== undefined) record.adminRemark = adminRemark;
    if (totalHours !== undefined) record.totalHours = totalHours;

    await record.save();
    res.json({ success: true, message: 'Attendance updated successfully', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

