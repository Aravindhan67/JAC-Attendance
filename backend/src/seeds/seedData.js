const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Fix for Windows / Node.js DNS SRV resolution on MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS fails
}

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Task = require('../models/Task');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const sampleEmployees = [
  {
    employeeId: 'JAC-001',
    name: 'Admin JAC',
    email: 'admin@jacmedia.com',
    password: 'admin123',
    role: 'admin',
    department: 'Management',
    designation: 'Operations Director',
    phone: '+91 98765 43210',
    shiftStartTime: '09:30',
    shiftEndTime: '18:30',
    status: 'active',
  },
  {
    employeeId: 'JAC-101',
    name: 'Rahul Sharma',
    email: 'rahul@jacmedia.com',
    password: 'user123',
    role: 'employee',
    department: 'Video Production',
    designation: 'Senior Video Editor',
    phone: '+91 98765 00101',
    shiftStartTime: '09:30',
    shiftEndTime: '18:30',
    status: 'active',
  },
  {
    employeeId: 'JAC-102',
    name: 'Priya Nair',
    email: 'priya@jacmedia.com',
    password: 'user123',
    role: 'employee',
    department: 'Creative & Design',
    designation: 'Motion Graphics Designer',
    phone: '+91 98765 00102',
    shiftStartTime: '09:30',
    shiftEndTime: '18:30',
    status: 'active',
  },
  {
    employeeId: 'JAC-103',
    name: 'Alex Chen',
    email: 'alex@jacmedia.com',
    password: 'user123',
    role: 'employee',
    department: 'Digital Marketing',
    designation: 'Campaign Strategist',
    phone: '+91 98765 00103',
    shiftStartTime: '09:30',
    shiftEndTime: '18:30',
    status: 'active',
  },
  {
    employeeId: 'JAC-104',
    name: 'Ananya Roy',
    email: 'ananya@jacmedia.com',
    password: 'user123',
    role: 'employee',
    department: 'Content & Copy',
    designation: 'Lead Content Writer',
    phone: '+91 98765 00104',
    shiftStartTime: '09:30',
    shiftEndTime: '18:30',
    status: 'active',
  },
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jac_attendance';
    console.log('[Seed] Connecting to MongoDB Atlas cluster...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    console.log('[Seed] Clearing existing demo data...');
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Task.deleteMany({});

    console.log('[Seed] Creating demo users...');
    const createdUsers = [];
    for (const emp of sampleEmployees) {
      const user = new User(emp);
      await user.save();
      createdUsers.push(user);
    }

    console.log(`[Seed] Created ${createdUsers.length} users.`);

    const admin = createdUsers.find((u) => u.employeeId === 'JAC-001');
    const rahul = createdUsers.find((u) => u.employeeId === 'JAC-101');
    const priya = createdUsers.find((u) => u.employeeId === 'JAC-102');

    // Create a sample pending leave for testing
    if (rahul) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      await Leave.create({
        user: rahul._id,
        leaveType: 'Casual Leave',
        startDate: tomorrow,
        endDate: dayAfter,
        totalDays: 2,
        reason: 'Family function out of town',
        status: 'pending',
      });
      console.log('[Seed] Created sample leave request for Rahul');
    }

    // Create sample tasks
    if (admin && rahul && priya) {
      const dueSoon = new Date();
      dueSoon.setDate(dueSoon.getDate() + 2);

      const dueTomorrow = new Date();
      dueTomorrow.setDate(dueTomorrow.getDate() + 1);

      await Task.create([
        {
          title: 'Commercial Brand Reel Sound Design & Grading',
          description: 'Apply the approved cinematic LUT, balance audio track mix, and export 4K master ProRes.',
          assignedTo: rahul._id,
          assignedBy: admin._id,
          department: 'Video Production',
          priority: 'high',
          status: 'in-progress',
          category: 'Video Editing',
          dueDate: dueSoon,
          progressNotes: [
            { text: 'Cut locked with director. Audio leveling in progress.', authorName: 'Rahul Sharma', createdAt: new Date() },
          ],
        },
        {
          title: '3D Motion Graphics Lower Thirds & Intro Bumper',
          description: 'Design dynamic 3D glassmorphic text animations in After Effects with alpha channel.',
          assignedTo: priya._id,
          assignedBy: admin._id,
          department: 'Creative & Design',
          priority: 'urgent',
          status: 'pending',
          category: 'Motion Graphics',
          dueDate: dueTomorrow,
        },
        {
          title: 'YouTube Thumbnail Variants & A/B Test Pack',
          description: 'Export 3 high-CTR thumbnail styles for the client brand launch campaign.',
          assignedTo: priya._id,
          assignedBy: admin._id,
          department: 'Creative & Design',
          priority: 'medium',
          status: 'completed',
          category: 'Thumbnail Design',
          dueDate: new Date(),
          completedAt: new Date(),
        },
      ]);
      console.log('[Seed] Created 3 sample tasks for Media deliverables');
    }

    console.log('\n=========================================');
    console.log('✅ MongoDB Atlas Seeded Successfully with Tasks!');
    console.log('Admin Login:');
    console.log('  Email/ID: admin@jacmedia.com or JAC-001');
    console.log('  Password: admin123');
    console.log('Employee Login:');
    console.log('  Email/ID: rahul@jacmedia.com or JAC-101');
    console.log('  Password: user123');
    console.log('=========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seed();
}

module.exports = { seed, sampleEmployees };
