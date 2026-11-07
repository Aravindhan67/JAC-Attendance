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
// Check-in NOT allowed after 09:45 AM (9 * 60 + 45 = 585 minutes)
const CLOCK_IN_CUTOFF_MINUTES = 9 * 60 + 45; // 09:45 AM
// Check-out NOT allowed after 07:00 PM (19 * 60 = 1140 minutes)
const CLOCK_OUT_CUTOFF_MINUTES = 19 * 60; // 07:00 PM (19:00)

// @desc Clock In with photo capture
// @route POST /api/attendance/clock-in
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photo, note, location } = req.body;

    const { totalMinutes } = getLocalTimeParts();

    // Enforce Rule: Check-in not allowed after 09:45 AM
    if (totalMinutes > CLOCK_IN_CUTOFF_MINUTES) {
      const formattedCurrentTime = new Intl.DateTimeFormat('en-IN', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date());

      return res.status(403).json({
        success: false,
        message: `Check-in is not allowed after 09:45 AM. Current time is ${formattedCurrentTime}. The morning punch-in window has closed. Please contact Admin or HR.`,
      });
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
    // Calculate if late: Standard shift is 09:30 AM. Punches between 09:31 and 09:45 AM are marked 'late'
    let status = 'present';
    const shiftTime = req.user.shiftStartTime || '09:30';
    const [shiftHour, shiftMin] = shiftTime.split(':').map(Number);
    const standardStartMinutes = shiftHour * 60 + shiftMin;

    if (totalMinutes > standardStartMinutes) {
      status = 'late';
    }

    if (!record) {
      record = new Attendance({
        user: userId,
        date: today,
        clockIn: {
          timestamp: now,
          photo: photoPath,
          note: note || '',
          location: location || 'Office',
        },
        status,
      });
    } else {
      record.clockIn = {
        timestamp: now,
        photo: photoPath,
        note: note || '',
        location: location || 'Office',
      };
      record.status = status;
    }

    await record.save();

    res.status(200).json({
      success: true,
      message: `Clocked in successfully at ${now.toLocaleTimeString('en-IN', { timeZone: TIMEZONE })}`,
      data: record,
    });
  } catch (error) {
    console.error('Clock-in error:', error);
    res.status(500).json({ success: false, message: 'Server error during clock in', error: error.message });
  }
};

// @desc Clock Out with photo capture
// @route POST /api/attendance/clock-out
exports.clockOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photo, note, location } = req.body;

    const { totalMinutes } = getLocalTimeParts();

    // Enforce Rule: Check-out not allowed after 07:00 PM (19:00)
    if (totalMinutes > CLOCK_OUT_CUTOFF_MINUTES) {
      const formattedCurrentTime = new Intl.DateTimeFormat('en-IN', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date());

      return res.status(403).json({
        success: false,
        message: `Check-out is not allowed after 07:00 PM. Current time is ${formattedCurrentTime}. The evening punch-out window has closed. Please contact Admin or HR to regularize your shift.`,
      });
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
      note: note || '',
      location: location || 'Office',
    };
    record.totalHours = totalHours;

    // If worked less than 4.5 hours, mark as half-day unless already marked late
    if (totalHours < 4.5 && record.status === 'present') {
      record.status = 'half-day';
    }

    await record.save();

    res.status(200).json({
      success: true,
      message: `Clocked out successfully at ${now.toLocaleTimeString('en-IN', { timeZone: TIMEZONE })}. Total hours: ${totalHours} hrs`,
      data: record,
    });
  } catch (error) {
    console.error('Clock-out error:', error);
    res.status(500).json({ success: false, message: 'Server error during clock out', error: error.message });
  }
};

// @desc Get Today's attendance status for logged-in user
// @route GET /api/attendance/today
exports.getTodayStatus = async (req, res) => {
  try {
    const today = getTodayDateString();
    const record = await Attendance.findOne({ user: req.user._id, date: today });
    const { totalMinutes } = getLocalTimeParts();

    const isCheckInClosed = totalMinutes > CLOCK_IN_CUTOFF_MINUTES;
    const isCheckOutClosed = totalMinutes > CLOCK_OUT_CUTOFF_MINUTES;

    res.json({
      success: true,
      data: record || null,
      serverTime: new Date(),
      rules: {
        checkInCutoff: '09:45 AM',
        checkOutCutoff: '07:00 PM',
        isCheckInClosed,
        isCheckOutClosed,
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

    res.json({
      success: true,
      data: records,
      stats: {
        totalDays: records.length,
        totalPresent,
        totalLate,
        totalHalfDay,
        totalHours: Math.round(totalHours * 10) / 10,
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

