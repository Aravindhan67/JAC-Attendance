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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F8ECE9] text-[#8A2418] border border-[#E9C3BC]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A2418] animate-pulse" />
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F6EFE2] text-[#8F5413] border border-[#DFCBB5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8F5413]" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E2ECE6] text-[#1B3B34] border border-[#BCD3C5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B3B34]" />
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE4D6] text-[#5A5347] border border-[#DCD4C4]">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E2ECE6] text-[#1B3B34] border border-[#BCD3C5]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1B3B34]" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F6EFE2] text-[#8F5413] border border-[#DFCBB5]">
            <span className="w-2 h-2 rounded-full bg-[#8F5413] animate-pulse" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAE4D6] text-[#5A5347] border border-[#DCD4C4]">
            <Clock className="w-3.5 h-3.5 text-[#5A5347]" />
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
              ? 'bg-[#B84030] text-white shadow-rose-200'
              : 'bg-[#1B3B34] text-[#FAF6EE] shadow-emerald-200'
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
          <h1 className="text-2xl font-black text-[#1B3B34] flex items-center gap-2 tracking-tight">
            <CheckSquare className="w-6 h-6 text-[#C25E37]" />
            My Assigned Tasks
          </h1>
          <p className="text-xs text-[#5A5347] mt-0.5 font-medium">
            Track daily deliverables, manage progress, and collaborate with your team
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#FAF6EE] p-1.5 rounded-2xl border border-[#DCD4C4] shadow-warm-sm self-start sm:self-auto overflow-x-auto max-w-full">
          {['all', 'pending', 'in-progress', 'completed'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                statusFilter === tab
                  ? 'bg-[#1B3B34] text-[#FAF6EE] shadow-warm-sm'
                  : 'text-[#5A5347] hover:text-[#23201B] hover:bg-[#EAE4D6]'
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

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-[#FAF6EE] rounded-3xl p-12 text-center text-[#8A8274] text-xs border border-[#DCD4C4]">
            Loading your tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-[#FAF6EE] rounded-3xl p-12 text-center border border-[#DCD4C4] shadow-warm-sm">
            <CheckSquare className="w-10 h-10 text-[#8A8274] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[#23201B]">No tasks found</h3>
            <p className="text-xs text-[#5A5347] mt-1">
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
                className={`bg-[#FAF6EE] rounded-2xl sm:rounded-3xl border transition-all p-5 shadow-warm-sm ${
                  isOverdue
                    ? 'border-[#E9C3BC] shadow-warm-md'
                    : 'border-[#DCD4C4] hover:border-[#1B3B34]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(task.priority)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE4D6] text-[#5A5347]">
                        {task.category}
                      </span>
                      {getStatusBadge(task.status)}
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8A2418] text-[#FAF6EE]">
                          ⚠️ Overdue
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#23201B] break-words">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-[#5A5347] leading-relaxed whitespace-pre-line">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#5A5347] pt-1">
                      <span className="flex items-center gap-1 text-[#23201B] font-medium font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-[#C25E37]" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                      {task.assignedBy?.name && (
                        <span className="flex items-center gap-1 text-[#5A5347]">
                          <User className="w-3.5 h-3.5 text-[#8A8274]" />
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
                        className="bg-[#1B3B34] hover:bg-[#254F46] text-[#FAF6EE] font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-warm-sm border border-[#142C26] active:scale-95"
                      >
                        Start Task
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(task._id, 'completed')}
                        className="bg-[#2D6A4F] hover:bg-[#245741] text-[#FAF6EE] font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-warm-sm active:scale-95"
                      >
                        Complete Task
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(task._id, 'pending')}
                        className="bg-[#EAE4D6] hover:bg-[#DCD4C4] text-[#23201B] font-semibold text-xs px-3 py-1.5 rounded-xl transition-all border border-[#DCD4C4]"
                      >
                        Reopen
                      </button>
                    )}

                    {/* Toggle Progress Notes */}
                    <button
                      type="button"
                      onClick={() => setExpandedTaskId(isExpanded ? null : task._id)}
                      className="text-xs text-[#C25E37] hover:text-[#AA4F2C] font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#EAE4D6] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Notes ({task.progressNotes?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Progress Notes Accordion */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#DCD4C4] space-y-3 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold text-[#1B3B34]">Progress Notes & Updates</h4>
                    
                    {task.progressNotes && task.progressNotes.length > 0 ? (
                      <div className="space-y-2">
                        {task.progressNotes.map((note, index) => (
                          <div key={index} className="p-2.5 bg-[#EAE4D6]/70 rounded-xl text-xs space-y-0.5 border border-[#DCD4C4]">
                            <div className="flex items-center justify-between text-[10px] text-[#5A5347]">
                              <span className="font-semibold text-[#23201B]">{note.authorName}</span>
                              <span className="font-mono">{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[#5A5347]">{note.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#8A8274] italic">No notes added yet.</p>
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
                        className="flex-1 text-xs px-3 py-2 bg-[#EAE4D6] border border-[#DCD4C4] rounded-xl text-[#23201B] placeholder-[#8A8274] focus:bg-[#FAF6EE] focus:outline-none focus:ring-2 focus:ring-[#C25E37]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNote(task._id)}
                        className="bg-[#C25E37] hover:bg-[#AA4F2C] text-[#FAF6EE] p-2 rounded-xl text-xs transition-all shadow-warm-sm shrink-0 border border-[#A74E2B] active:scale-95"
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

