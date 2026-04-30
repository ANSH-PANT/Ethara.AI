import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'];
const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [isAdmin, setIsAdmin] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', priority: 'MEDIUM', assignedTo: '' });
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState('');

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [savingMember, setSavingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = useCallback(async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        projectsAPI.getOne(id),
        tasksAPI.getByProject(id),
      ]);
      setProject(projRes.data);
      setIsAdmin(projRes.data.role === 'ADMIN');
      setTasks(taskRes.data);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', dueDate: '', priority: 'MEDIUM', assignedTo: '' });
    setTaskError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority,
      assignedTo: task.assignedTo || '',
    });
    setTaskError('');
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setSavingTask(true);
    setTaskError('');
    try {
      const payload = {
        ...taskForm,
        assignedTo: taskForm.assignedTo || null,
        dueDate: taskForm.dueDate || null,
      };
      if (editingTask) {
        const res = await tasksAPI.update(editingTask.id, payload);
        setTasks(tasks.map((t) => (t.id === editingTask.id ? res.data : t)));
      } else {
        const res = await tasksAPI.create(id, payload);
        setTasks([res.data, ...tasks]);
      }
      setShowTaskModal(false);
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await tasksAPI.delete(taskId);
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const handleStatusChange = async (taskId, status) => {
    const res = await tasksAPI.update(taskId, { status });
    setTasks(tasks.map((t) => (t.id === taskId ? res.data : t)));
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSavingMember(true);
    setMemberError('');
    try {
      await projectsAPI.addMember(id, { email: memberEmail, role: memberRole });
      await load();
      setShowMemberModal(false);
      setMemberEmail('');
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await projectsAPI.removeMember(id, userId);
    setProject({ ...project, members: project.members.filter((m) => m.userId !== userId) });
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project? This cannot be undone.')) return;
    await projectsAPI.delete(id);
    navigate('/projects');
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading project...</div>;
  if (!project) return null;

  const filteredTasks = statusFilter === 'ALL' ? tasks : tasks.filter((t) => t.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className={`badge ${isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
              {isAdmin ? 'Admin' : 'Member'}
            </span>
            <span className="text-sm text-gray-400">{tasks.length} tasks · {project.members.length} members</span>
          </div>
        </div>
        {isAdmin && (
          <button onClick={handleDeleteProject} className="btn-danger text-sm">Delete Project</button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {['tasks', 'members'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {['ALL', ...STATUS_OPTIONS].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
            {isAdmin && (
              <button onClick={openCreateTask} className="btn-primary text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-gray-400">No tasks found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isAdmin={isAdmin}
                  currentUserId={user.id}
                  onEdit={openEditTask}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={() => setShowMemberModal(true)} className="btn-primary text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Member
              </button>
            </div>
          )}
          <div className="card divide-y divide-gray-100">
            {project.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-700">
                      {m.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${m.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {m.role}
                  </span>
                  {isAdmin && m.userId !== user.id && (
                    <button onClick={() => handleRemoveMember(m.userId)} className="text-red-400 hover:text-red-600 text-xs">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title={editingTask ? 'Edit Task' : 'Create Task'}>
        <form onSubmit={handleSaveTask} className="space-y-4">
          {taskError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{taskError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="input" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input resize-none" rows={3} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="input" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select className="input" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {project.members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={savingTask}>{savingTask ? 'Saving...' : 'Save Task'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showMemberModal} onClose={() => { setShowMemberModal(false); setMemberError(''); }} title="Add Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          {memberError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{memberError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
            <input type="email" className="input" placeholder="member@example.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={savingMember}>{savingMember ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
