import { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';
import TaskCard from '../components/TaskCard';
import { useAuth } from '../context/AuthContext';

export default function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    tasksAPI.getMyTasks()
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, status) => {
    const res = await tasksAPI.update(taskId, { status });
    setTasks(tasks.map((t) => (t.id === taskId ? res.data : t)));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading tasks...</div>;

  const filtered = statusFilter === 'ALL' ? tasks : tasks.filter((t) => t.status === statusFilter);
  const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-700 text-sm font-medium">
            You have {overdue.length} overdue task{overdue.length !== 1 ? 's' : ''}. Please update their status.
          </p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
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

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-gray-400">
            {statusFilter === 'ALL' ? 'No tasks assigned to you yet.' : `No ${statusFilter.replace('_', ' ').toLowerCase()} tasks.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isAdmin={false}
              currentUserId={user.id}
              showProject
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
