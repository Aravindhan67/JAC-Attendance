const express = require('express');
const router = express.Router();
const {
  createTask,
  getMyTasks,
  getAllTasks,
  updateTaskStatus,
  addProgressNote,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All routes require user authentication
router.use(protect);

router.get('/my-tasks', getMyTasks);
router.get('/all', getAllTasks);
router.post('/', createTask);
router.put('/:id/status', updateTaskStatus);
router.post('/:id/note', addProgressNote);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
