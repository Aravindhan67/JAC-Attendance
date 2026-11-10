import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  Trash2,
  MessageSquare,
  Send,
} from 'lucide-react';

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    department: 'Video Production',
    priority: 'medium',
    category: 'Video Editing',
    dueDate: '',
  });

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `/tasks/all?status=${statusFilter}&priority=${priorityFilter}&department=${departmentFilter}&assignedTo=${assigneeFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setTasks(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, departmentFilter, assigneeFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    const firstEmp = employees.length > 0 ? employees[0] : null;
    setFormData({
      title: '',
      description: '',
      assignedTo: firstEmp ? firstEmp._id : '',
      department: firstEmp ? firstEmp.department : 'General',
      priority: 'medium',
      category: 'General',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || task.assignedTo,
      department: task.department || 'Video Production',
      priority: task.priority || 'medium',
      category: task.category || 'Video Editing',
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.title || !formData.title.trim()) {
      setFormError('Task title is required');
      return;
    }
    if (!formData.assignedTo) {
      setFormError('Please select an employee to assign this task to');
      return;
    }
    if (!formData.dueDate) {
      setFormError('Due date is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        priority: (formData.priority || 'medium').toLowerCase(),
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
        showToast('Task updated successfully');
      } else {
        await api.post('/tasks', payload);
        showToast('Task assigned successfully');
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      console.error('[AdminTasks Error]:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to save task. Please ensure your backend is running.';
      setFormError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (id, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try {
      await api.delete(`/tasks/${id}`);
      showToast('Task removed');
      fetchTasks();
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      showToast(`Status updated to ${newStatus}`);
      fetchTasks();
    } catch (err) {
      showToast('Status update failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold shadow-lg transition-all animate-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white shadow-rose-200'
              : 'bg-emerald-600 text-white shadow-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="opacity-80 hover:opacity-100 text-base">✕</button>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1B3B34] flex items-center gap-2 tracking-tight">
            <CheckSquare className="w-6 h-6 text-[#C25E37]" />
            Task Management & Assignment
          </h1>
          <p className="text-xs text-[#5A5347] mt-0.5 font-medium">
            Assign deliverables to staff, track progress timelines, and oversee project delivery
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="bg-[#C25E37] hover:bg-[#AA4F2C] text-[#FAF6EE] text-xs font-bold px-5 py-2.5 rounded-xl shadow-warm-sm flex items-center gap-2 transition-all self-start sm:self-auto border border-[#A74E2B] active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Assign New Task
        </button>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Total Tasks</span>
            <div className="text-2xl font-black text-[#1B3B34] mt-1">{stats.total}</div>
          </div>
          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">In Progress</span>
            <div className="text-2xl font-black text-[#9C6500] mt-1">{stats.inProgress}</div>
          </div>
          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <div className="text-2xl font-black text-[#1B3B34] mt-1">{stats.completed}</div>
          </div>
          <div className="bg-[#FAF6EE] p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm">
            <span className="text-[#8A8274] text-[11px] font-bold uppercase tracking-wider">Overdue</span>
            <div className="text-2xl font-black text-[#B84030] mt-1">{stats.overdue}</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#FAF6EE] p-3.5 sm:p-4 rounded-2xl border border-[#DCD4C4] shadow-warm-sm flex flex-wrap items-center gap-2 sm:gap-3">
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl px-3 py-2 text-xs font-bold text-[#23201B] focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl px-3 py-2 text-xs font-bold text-[#23201B] focus:outline-none cursor-pointer"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl px-3 py-2 text-xs font-bold text-[#23201B] focus:outline-none cursor-pointer"
        >
          <option value="All">All Assignees</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name} ({emp.employeeId})
            </option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl px-3 py-2 text-xs font-bold text-[#23201B] focus:outline-none cursor-pointer"
        >
          <option value="All">All Departments</option>
          <option value="Business Development (BDA)">Business Development (BDA)</option>
          <option value="Business Development">Business Development</option>
          <option value="Full Stack Development">Full Stack Development</option>
          <option value="UI/UX Design">UI/UX Design</option>
          <option value="Frontend Development">Frontend Development</option>
          <option value="Backend Development">Backend Development</option>
          <option value="Mobile App Development">Mobile App Development</option>
          <option value="QA & Testing">QA & Testing</option>
          <option value="DevOps & Cloud">DevOps & Cloud</option>
          <option value="IT & Tech Support">IT & Tech Support</option>
          <option value="Administration">Administration</option>
          <option value="Project Management">Project Management</option>
          <option value="Digital Marketing">Digital Marketing</option>
        </select>

      </div>

      {/* Tasks Table */}
      <div className="bg-[#FAF6EE] rounded-3xl border border-[#DCD4C4] shadow-warm-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EAE4D6]/70 text-[#5A5347] uppercase tracking-wider text-[10px] font-bold border-b border-[#DCD4C4]">
              <tr>
                <th className="py-3.5 px-6">Task Title & Details</th>
                <th className="py-3.5 px-4">Assignee</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading task registry...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No tasks found matching criteria. Click "Assign New Task" above.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const isOverdue =
                    task.status !== 'completed' && new Date(task.dueDate) < new Date();

                  return (
                    <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 max-w-sm">
                        <div className="font-bold text-slate-800 break-words">{task.title}</div>
                        {task.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">{task.assignedTo?.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {task.assignedTo?.employeeId} • {task.department}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                          {task.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold capitalize">
                        {task.priority === 'urgent' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-300 shadow-xs shadow-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            Urgent
                          </span>
                        )}
                        {task.priority === 'high' && (
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            High
                          </span>
                        )}
                        {task.priority === 'medium' && (
                          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            Medium
                          </span>
                        )}
                        {task.priority === 'low' && (
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            Low
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        {isOverdue && <span className="text-[10px] text-rose-500 font-bold">Overdue</span>}
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                            task.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : task.status === 'in-progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Task"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task._id, task.title)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23201B]/50 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-[#FAF6EE] rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#DCD4C4] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#DCD4C4] bg-[#FAF6EE] shrink-0">
              <h3 className="text-base font-bold text-[#1B3B34]">
                {editingTask ? 'Edit Task Deliverable' : 'Assign New Task'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A8274] hover:text-[#23201B] p-1.5 rounded-lg hover:bg-[#EAE4D6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-[#F8ECE9] border border-[#E9C3BC] rounded-xl text-xs text-[#8A2418] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brand Reel Video Edit & Sound Mix"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                    Assign To Employee
                  </label>
                  <select
                    required
                    value={formData.assignedTo}
                    onChange={(e) => {
                      const emp = employees.find((x) => x._id === e.target.value);
                      setFormData({
                        ...formData,
                        assignedTo: e.target.value,
                        department: emp?.department || formData.department,
                      });
                    }}
                    className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                  >
                    <option value="">Select Staff Member</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employeeId} - {emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                    Category / Deliverable
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                  >
                    <option value="Full Stack Dev">Full Stack Feature</option>
                    <option value="Business Development">Business Development & Client Outreach (BDA)</option>
                    <option value="Frontend UI">Frontend UI / Component</option>
                    <option value="Backend API">Backend API / Database</option>
                    <option value="UI/UX Design">UI/UX Wireframe & Prototype</option>
                    <option value="Mobile App">Mobile App Screen</option>
                    <option value="Bug Fix">Bug Fix / Hotfix</option>
                    <option value="Code Review">Code Review & PR</option>
                    <option value="QA Testing">QA Test Suite</option>
                    <option value="DevOps Deployment">DevOps Deployment / CI/CD</option>
                    <option value="System Administration">System Administration</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5347] mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the instructions, assets link, format requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5A5347] hover:text-[#23201B] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#C25E37] hover:bg-[#AA4F2C] disabled:opacity-50 text-[#FAF6EE] font-bold text-xs px-5 py-2.5 rounded-xl shadow-warm-sm border border-[#A74E2B] transition-all active:scale-95"
                >
                  {submitting
                    ? 'Saving...'
                    : editingTask
                    ? 'Update Task'
                    : 'Assign Task'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

