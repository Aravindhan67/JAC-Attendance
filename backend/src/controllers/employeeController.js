const User = require('../models/User');

// @desc Admin: Get all employees
// @route GET /api/employees
exports.getEmployees = async (req, res) => {
  try {
    const { department, status, search } = req.query;
    const filter = {};

    if (department && department !== 'All') {
      filter.department = department;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(filter).select('-password').sort({ employeeId: 1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Create a new employee
// @route POST /api/employees
exports.createEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      password,
      role,
      department,
      designation,
      phone,
      shiftStartTime,
      shiftEndTime,
    } = req.body;

    if (!employeeId || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Name, Email and Password are required',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { employeeId: employeeId.toUpperCase() }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this Email or Employee ID already exists',
      });
    }

    const newEmployee = new User({
      employeeId: employeeId.toUpperCase(),
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'employee',
      department: department || 'General',
      designation: designation || 'Team Member',
      phone: phone || '',
      shiftStartTime: shiftStartTime || '09:30',
      shiftEndTime: shiftEndTime || '18:30',
      status: 'active',
    });

    await newEmployee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: newEmployee._id,
        employeeId: newEmployee.employeeId,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department,
        designation: newEmployee.designation,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Update employee details
// @route PUT /api/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const { name, department, designation, phone, role, status, shiftStartTime, shiftEndTime, password } = req.body;
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (name) employee.name = name;
    if (department) employee.department = department;
    if (designation) employee.designation = designation;
    if (phone !== undefined) employee.phone = phone;
    if (role) employee.role = role;
    if (status) employee.status = status;
    if (shiftStartTime) employee.shiftStartTime = shiftStartTime;
    if (shiftEndTime) employee.shiftEndTime = shiftEndTime;
    if (password) employee.password = password; // pre-save will re-hash

    await employee.save();

    res.json({
      success: true,
      message: 'Employee details updated successfully',
      data: employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Delete employee
// @route DELETE /api/employees/:id
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Safety: prevent deleting self
    if (employee._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

