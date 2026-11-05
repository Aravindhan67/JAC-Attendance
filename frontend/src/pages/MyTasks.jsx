import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Send,
  Sparkles,
  ChevronRight,
  User,
  Filter,
} from 'lucide-react';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [noteInputs, setNoteInputs] = useState({});
  const [toast, setToast] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks/my-tasks?status=${statusFilter}`);
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
    fetchTasks();
  }, [statusFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(`Task marked as ${newStatus.replace('-', ' ')}`);
        fetchTasks();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update task', 'error');
    }
  };

  const handleAddNote = async (taskId) => {
    const text = noteInputs[taskId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post(`/tasks/${taskId}/note`, { text });
      if (res.data.success) {
        showToast('Progress note added');
        setNoteInputs({ ...noteInputs, [taskId]: '' });
        fetchTasks();
      }
    } catch (err) {
      showToast('Failed to add note', 'error');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-xs shadow-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending
          </span>
        );
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-500" />
            My Assigned Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track daily deliverables, manage progress, and collaborate with your team
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs self-start sm:self-auto overflow-x-auto max-w-full">
          {['all', 'pending', 'in-progress', 'completed'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                statusFilter === tab
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Task Summary Metrics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Tasks</span>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">In Progress</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{stats.inProgress}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{stats.completed}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Overdue</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{stats.overdue}</div>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-slate-200">
            Loading your tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No tasks found</h3>
            <p className="text-xs text-slate-400 mt-1">
              You're all caught up! When assignments are delegated by management, they will appear here.
            </p>
          </div>
        ) : (
          tasks.map((task) => {
            const isOverdue =
              task.status !== 'completed' && new Date(task.dueDate) < new Date();
            const isExpanded = expandedTaskId === task._id;

            return (
              <div
                key={task._id}
                className={`bg-white rounded-2xl sm:rounded-3xl border transition-all p-5 shadow-xs ${
                  isOverdue
                    ? 'border-rose-300/80 shadow-rose-100'
                    : 'border-slate-200/80 hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(task.priority)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {task.category}
                      </span>
                      {getStatusBadge(task.status)}
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                          ⚠️ Overdue
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-800 break-words">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      {task.assignedBy?.name && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <User className="w-3.5 h-3.5" />
                          Assigned by {task.assignedBy.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex sm:flex-col items-center gap-2 self-start sm:self-auto shrink-0 pt-2 sm:pt-0">
                    {task.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(task._id, 'in-progress')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
                      >
                        Start Task
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(task._id, 'completed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
                      >
                        Complete Task
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(task._id, 'pending')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs px-3 py-1.5 rounded-xl transition-all"
                      >
                        Reopen
                      </button>
                    )}

                    {/* Toggle Progress Notes */}
                    <button
                      type="button"
                      onClick={() => setExpandedTaskId(isExpanded ? null : task._id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Notes ({task.progressNotes?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Progress Notes Accordion */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold text-slate-700">Progress Notes & Updates</h4>
                    
                    {task.progressNotes && task.progressNotes.length > 0 ? (
                      <div className="space-y-2">
                        {task.progressNotes.map((note, index) => (
                          <div key={index} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-0.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-semibold text-slate-700">{note.authorName}</span>
                              <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-600">{note.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No notes added yet.</p>
                    )}

                    {/* Add note form */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add update (e.g. Render completed, uploaded draft)..."
                        value={noteInputs[task._id] || ''}
                        onChange={(e) =>
                          setNoteInputs({ ...noteInputs, [task._id]: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote(task._id)}
                        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNote(task._id)}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 p-2 rounded-xl text-xs transition-all shadow-xs shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

