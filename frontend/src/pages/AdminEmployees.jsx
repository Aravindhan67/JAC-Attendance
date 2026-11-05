import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Mail,
  Briefcase,
  Clock,
} from 'lucide-react';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    department: 'Full Stack Development',
    designation: 'Full Stack Developer',
    role: 'employee',
    phone: '',
    shiftStartTime: '09:30',
    shiftEndTime: '18:30',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/employees?search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setEmployees(res.data.data);
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      employeeId: `JAC-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      email: '',
      password: '',
      department: 'Full Stack Development',
      designation: 'Full Stack Developer',
      role: 'employee',
      phone: '',
      shiftStartTime: '09:30',
      shiftEndTime: '18:30',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      password: '', // blank if unchanged
      department: emp.department || 'Full Stack Development',
      designation: emp.designation || 'Full Stack Developer',
      role: emp.role || 'employee',
      phone: emp.phone || '',
      shiftStartTime: emp.shiftStartTime || '09:30',
      shiftEndTime: emp.shiftEndTime || '18:30',
      status: emp.status || 'active',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingEmployee) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/employees/${editingEmployee._id}`, payload);
        showToast('Employee updated successfully');
      } else {
        if (!formData.password) {
          setFormError('Password is required for new employees');
          setSubmitting(false);
          return;
        }
        await api.post('/employees', formData);
        showToast('New employee registered successfully');
      }

      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove employee "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/employees/${id}`);
      showToast('Employee removed successfully');
      fetchEmployees();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
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
          <h1 className="text-2xl font-black text-slate-800">Staff Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add team members, assign shift timings, and manage departments
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all self-start sm:self-auto uppercase tracking-wider"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
          Add Employee
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Search employees by name, ID or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchEmployees()}
          className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
        />
        <button
          type="button"
          onClick={fetchEmployees}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-semibold"
        >
          Search
        </button>
      </div>

      {/* Employees Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Employee ID</th>
                <th className="py-3.5 px-4">Name & Email</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Shift Timings</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading staff directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No employees found. Click "Add Employee" to register staff.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                      {emp.employeeId}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        {emp.name}
                        {emp.role === 'admin' && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded-full font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{emp.email}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
                      {emp.department}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {emp.designation}
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-mono text-[11px]">
                      {emp.shiftStartTime} – {emp.shiftEndTime}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Employee"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp._id, emp.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-800">
                {editingEmployee ? 'Edit Employee Details' : 'Register New Employee'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingEmployee)}
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 uppercase font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password {editingEmployee && '(leave blank to keep unchanged)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingEmployee ? '••••••••' : 'Enter password'}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => {
                      const dept = e.target.value;
                      let desig = formData.designation;
                      if (dept === 'Full Stack Development') desig = 'Full Stack Developer';
                      else if (dept === 'UI/UX Design') desig = 'UI/UX Designer';
                      else if (dept === 'Frontend Development') desig = 'Frontend Developer';
                      else if (dept === 'Backend Development') desig = 'Backend Developer';
                      else if (dept === 'Mobile App Development') desig = 'Mobile App Developer';
                      else if (dept === 'QA & Testing') desig = 'QA Automation Engineer';
                      else if (dept === 'DevOps & Cloud') desig = 'DevOps Engineer';
                      else if (dept === 'IT & Tech Support') desig = 'IT Specialist';
                      else if (dept === 'Administration') desig = 'Administrator';
                      else if (dept === 'Project Management') desig = 'Project Manager';
                      else if (dept === 'Digital Marketing') desig = 'Digital Marketing Strategist';
                      setFormData({ ...formData, department: dept, designation: desig });
                    }}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Full Stack Developer"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Role Selection (Administrator vs Employee) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Role / Access
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-semibold text-slate-800"
                  >
                    <option value="employee">👤 Employee (Staff)</option>
                    <option value="admin">🛡️ Administrator (Full Admin Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift Start (24hr HH:MM)
                  </label>
                  <input
                    type="text"
                    value={formData.shiftStartTime}
                    onChange={(e) => setFormData({ ...formData, shiftStartTime: e.target.value })}
                    placeholder="09:30"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift End (24hr HH:MM)
                  </label>
                  <input
                    type="text"
                    value={formData.shiftEndTime}
                    onChange={(e) => setFormData({ ...formData, shiftEndTime: e.target.value })}
                    placeholder="18:30"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>
              </div>

              {editingEmployee && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (Deactivated)</option>
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/25 uppercase tracking-wider"
                >
                  {submitting
                    ? 'Saving...'
                    : editingEmployee
                    ? 'Update Employee'
                    : 'Create Employee'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

