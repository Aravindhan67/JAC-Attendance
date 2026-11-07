const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD for reliable day grouping
      required: true,
      index: true,
    },
    clockIn: {
      timestamp: { type: Date },
      photo: { type: String }, // path or base64 data url
      note: { type: String, default: '' },
      location: { type: String, default: 'Office' },
      punchType: {
        type: String,
        enum: ['Regular', 'Late Check-In', 'Forgot Check-In'],
        default: 'Regular',
      },
    },
    clockOut: {
      timestamp: { type: Date },
      photo: { type: String },
      note: { type: String, default: '' },
      location: { type: String, default: 'Office' },
      punchType: {
        type: String,
        enum: ['Regular', 'Forgot Check-Out'],
        default: 'Regular',
      },
    },
    status: {
      type: String,
      enum: ['present', 'late', 'half-day', 'absent', 'leave'],
      default: 'present',
    },
    exceptionType: {
      type: String,
      enum: ['none', 'Late Check-In', 'Forgot Check-In', 'Forgot Check-Out'],
      default: 'none',
    },
    totalHours: {
      type: Number,
      default: 0, // In decimal hours (e.g. 8.25 hrs)
    },
    adminRemark: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so a user has one attendance record per date
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

