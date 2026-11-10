const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Task = require('../models/Task');
const { saveBase64Image } = require('../utils/photoStorage');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// @desc Login user & return token
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // Can be email OR employeeId

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide Email/Employee ID and Password' });
    }

    const cleanId = identifier.trim();
    // Search by email or employeeId (case insensitive)
    const user = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { employeeId: cleanId.toUpperCase() },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Wrong password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact Admin.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        shiftStartTime: user.shiftStartTime,
        shiftEndTime: user.shiftEndTime,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// @desc Get current logged-in user profile
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc Get comprehensive employee profile data (Personal, Shift, Entitlements, Metrics)
// @route GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const yearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // 1. Current Month Attendance Summary
    const monthlyAttendance = await Attendance.find({
      user: userId,
      date: { $regex: `^${yearMonth}` },
    });

    const totalDaysLogged = monthlyAttendance.length;
    const totalPresent = monthlyAttendance.filter((r) => r.status === 'present').length;
    const totalLate = monthlyAttendance.filter((r) => r.status === 'late').length;
    const totalHalfDay = monthlyAttendance.filter((r) => r.status === 'half-day').length;
    const totalHours = Math.round(monthlyAttendance.reduce((acc, curr) => acc + (curr.totalHours || 0), 0) * 100) / 100;

    // 2. Exception Quota (3/month for Late / Forgot check-in / Forgot check-out)
    const usedExceptions = monthlyAttendance.filter(
      (r) =>
        ['Late Check-In', 'Forgot Check-In', 'Forgot Check-Out'].includes(r.exceptionType) ||
        ['Late Check-In', 'Forgot Check-In'].includes(r.clockIn?.punchType) ||
        r.clockOut?.punchType === 'Forgot Check-Out'
    ).length;

    // 3. Leave Quota (Casual 1, Sick 2, Emergency 1)
    const userLeaves = await Leave.find({
      user: userId,
      status: 'approved',
    });

    const leaveUsed = {
      'Casual Leave': 0,
      'Sick Leave': 0,
      'Emergency Leave': 0,
    };

    userLeaves.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      let cur = new Date(start);
      while (cur <= end) {
        if (cur.getFullYear() === currentYear && cur.getMonth() === currentMonth) {
          if (leaveUsed[leave.leaveType] !== undefined) {
            leaveUsed[leave.leaveType] += 1;
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    });

    // 4. Tasks Summary
    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $in: ['pending', 'in-progress'] },
    });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: 'completed',
    });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          totalDaysLogged,
          totalPresent,
          totalLate,
          totalHalfDay,
          totalHours,
          pendingTasks,
          completedTasks,
        },
        exceptionQuota: {
          limit: 3,
          used: usedExceptions,
          remaining: Math.max(0, 3 - usedExceptions),
        },
        leaveQuotas: {
          casual: {
            limit: 1,
            used: leaveUsed['Casual Leave'],
            remaining: Math.max(0, 1 - leaveUsed['Casual Leave']),
          },
          sick: {
            limit: 2,
            used: leaveUsed['Sick Leave'],
            remaining: Math.max(0, 2 - leaveUsed['Sick Leave']),
          },
          emergency: {
            limit: 1,
            used: leaveUsed['Emergency Leave'],
            remaining: Math.max(0, 1 - leaveUsed['Emergency Leave']),
          },
        },
      },
    });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving profile', error: error.message });
  }
};

// @desc Update employee personal profile details & photo
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name,
      phone,
      dob,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      profileImage,
    } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (dob !== undefined) user.dob = dob;
    if (gender !== undefined) user.gender = gender;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup.trim();
    if (address !== undefined) user.address = address.trim();
    if (emergencyContact) {
      user.emergencyContact = {
        name: emergencyContact.name || '',
        relationship: emergencyContact.relationship || '',
        phone: emergencyContact.phone || '',
      };
    }

    if (profileImage && profileImage.startsWith('data:image')) {
      const savedPath = saveBase64Image(profileImage, 'profile');
      if (savedPath) user.profileImage = savedPath;
    } else if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    const sanitized = await User.findById(user._id).select('-password');
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitized,
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile', error: error.message });
  }
};

// @desc Change Password
// @route PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Provide both current and new passwords' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

