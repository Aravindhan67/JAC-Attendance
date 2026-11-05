const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['employee', 'admin', 'manager'],
      default: 'employee',
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
    },
    designation: {
      type: String,
      default: 'Team Member',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    shiftStartTime: {
      type: String,
      default: '09:30', // HH:MM in 24hr format
    },
    shiftEndTime: {
      type: String,
      default: '18:30', // HH:MM in 24hr format
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

