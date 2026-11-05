const Task = require('../models/Task');
const User = require('../models/User');

// @desc Create a new task (Admin / Manager)
// @route POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, category, dueDate, department } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task Title is required' });
    }
    if (!assignedTo) {
      return res.status(400).json({ success: false, message: 'Please select an employee to assign this task to' });
    }
    if (!dueDate) {
      return res.status(400).json({ success: false, message: 'Due Date is required' });
    }

    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res.status(404).json({ success: false, message: 'Selected assignee was not found in database' });
    }

    // Clean & normalize priority
    const cleanPriority = (priority || 'medium').toString().toLowerCase().trim();
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const finalPriority = validPriorities.includes(cleanPriority) ? cleanPriority : 'medium';

    // Parse due date safely
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid Due Date format' });
    }

    // Determine assigner
    const assignerId = req.user ? req.user._id : assignedTo;

    const task = new Task({
      title: title.trim(),
      description: (description || '').trim(),
      assignedTo,
      assignedBy: assignerId,
      department: department || assignee.department || 'General',
      priority: finalPriority,
      category: (category || 'General').trim(),
      dueDate: parsedDueDate,
      status: 'pending',
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name employeeId department designation profileImage')
      .populate('assignedBy', 'name role');

    console.log(`[Task Created] ID: ${task._id}, Title: "${task.title}", AssignedTo: ${assignee.name}`);

    res.status(201).json({
      success: true,
      message: 'Task created and assigned successfully',
      data: populatedTask,
    });
  } catch (error) {
    console.error('[Create Task Error]:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating task',
    });
  }
};

// @desc Get logged-in user's assigned tasks
// @route GET /api/tasks/my-tasks
exports.getMyTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = { assignedTo: req.user._id };

    if (status && status !== 'all') {
      filter.status = status.toLowerCase();
    }
    if (priority && priority !== 'all') {
      filter.priority = priority.toLowerCase();
    }

    const tasks = await Task.find(filter)
      .populate('assignedBy', 'name role')
      .sort({ dueDate: 1, createdAt: -1 });

    const now = new Date();
    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      overdue: tasks.filter((t) => t.status !== 'completed' && new Date(t.dueDate) < now).length,
    };

    res.json({ success: true, count: tasks.length, data: tasks, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Get all tasks with filtering
// @route GET /api/tasks/all
exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, department, assignedTo } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status.toLowerCase();
    }
    if (priority && priority !== 'all') {
      filter.priority = priority.toLowerCase();
    }
    if (department && department !== 'All') {
      filter.department = department;
    }
    if (assignedTo && assignedTo !== 'All') {
      filter.assignedTo = assignedTo;
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name employeeId department designation profileImage')
      .populate('assignedBy', 'name role')
      .sort({ dueDate: 1, createdAt: -1 });

    const now = new Date();
    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      overdue: tasks.filter((t) => t.status !== 'completed' && new Date(t.dueDate) < now).length,
    };

    res.json({ success: true, count: tasks.length, data: tasks, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update task status (Employee or Admin)
// @route PUT /api/tasks/:id/status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const cleanStatus = (status || '').toLowerCase().trim();

    if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(cleanStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = cleanStatus;
    if (cleanStatus === 'completed') {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    await task.save();

    res.json({ success: true, message: `Task status updated to ${cleanStatus}`, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add a progress note to task
// @route POST /api/tasks/:id/note
exports.addProgressNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.progressNotes.push({
      text: text.trim(),
      authorName: req.user ? req.user.name : 'Team Member',
      createdAt: new Date(),
    });

    await task.save();

    res.json({ success: true, message: 'Progress note added', data: task.progressNotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Edit task details
// @route PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, category, dueDate, department } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (title) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (assignedTo) task.assignedTo = assignedTo;
    if (priority) task.priority = priority.toLowerCase().trim();
    if (category) task.category = category.trim();
    if (dueDate) task.dueDate = new Date(dueDate);
    if (department) task.department = department;

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name employeeId department designation profileImage')
      .populate('assignedBy', 'name');

    res.json({ success: true, message: 'Task updated successfully', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Admin: Delete task
// @route DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
