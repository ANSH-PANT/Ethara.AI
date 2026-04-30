const PRIORITY_COLORS = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'];

const isOverdue = (task) =>
  task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

export default function TaskCard({ task, isAdmin, currentUserId, onEdit, onDelete, onStatusChange, showProject }) {
  const canUpdateStatus = isAdmin || task.assignedTo === currentUserId;
  const overdue = isOverdue(task);

  return (
    <div className={`card flex flex-col sm:flex-row sm:items-start gap-4 ${overdue ? 'border-red-200' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 flex-wrap">
          <h3 className={`font-semibold text-gray-900 ${task.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h3>
          <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
          {overdue && <span className="badge bg-red-100 text-red-700">Overdue</span>}
        </div>

        {task.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
          {showProject && task.project && (
            <span className="font-medium text-indigo-600">{task.project.name}</span>
          )}
          {task.assignee && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {task.assignee.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {canUpdateStatus && (
          <select
            value={task.status}
            onChange={(e) => onStatusChange && onStatusChange(task.id, e.target.value)}
            className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer ${STATUS_COLORS[task.status]}`}
            onClick={(e) => e.stopPropagation()}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        )}

        {isAdmin && onEdit && (
          <button
            onClick={() => onEdit(task)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            title="Edit task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {isAdmin && onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
            title="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
