const prisma = require('../lib/prisma');

const requireProjectAccess = async (projectId, userId) => {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
};

const getProjectTasks = async (req, res) => {
  const { projectId } = req.params;

  const membership = await requireProjectAccess(projectId, req.user.id);
  if (!membership) return res.status(403).json({ message: 'Access denied' });

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tasks);
};

const getMyTasks = async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { assignedTo: req.user.id },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
  res.json(tasks);
};

const createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, dueDate, priority, assignedTo } = req.body;

  if (!title) return res.status(400).json({ message: 'Task title is required' });

  const membership = await requireProjectAccess(projectId, req.user.id);
  if (!membership || membership.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required to create tasks' });
  }

  if (assignedTo) {
    const assigneeMembership = await requireProjectAccess(projectId, assignedTo);
    if (!assigneeMembership) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'MEDIUM',
      projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user.id,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
  });
  res.status(201).json(task);
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, priority, status, assignedTo } = req.body;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const membership = await requireProjectAccess(task.projectId, req.user.id);
  if (!membership) return res.status(403).json({ message: 'Access denied' });

  const isAdmin = membership.role === 'ADMIN';
  const isAssignee = task.assignedTo === req.user.id;

  if (!isAdmin && !isAssignee) {
    return res.status(403).json({ message: 'You can only update tasks assigned to you' });
  }

  const updateData = {};

  if (isAdmin) {
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
  }

  if (status !== undefined) updateData.status = status;

  const updated = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
  });
  res.json(updated);
};

const deleteTask = async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const membership = await requireProjectAccess(task.projectId, req.user.id);
  if (!membership || membership.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  await prisma.task.delete({ where: { id } });
  res.json({ message: 'Task deleted' });
};

const getTask = async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const membership = await requireProjectAccess(task.projectId, req.user.id);
  if (!membership) return res.status(403).json({ message: 'Access denied' });

  res.json(task);
};

module.exports = { getProjectTasks, getMyTasks, createTask, updateTask, deleteTask, getTask };
