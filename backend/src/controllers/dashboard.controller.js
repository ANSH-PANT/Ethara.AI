const prisma = require('../lib/prisma');

const getDashboard = async (req, res) => {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.user.id },
    select: { projectId: true, role: true },
  });

  const projectIds = memberships.map((m) => m.projectId);

  const [totalTasks, tasksByStatus, overdueTasks, tasksByUser] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: projectIds } } }),

    prisma.task.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: { status: true },
    }),

    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: new Date() },
        status: { not: 'DONE' },
      },
    }),

    prisma.task.groupBy({
      by: ['assignedTo'],
      where: {
        projectId: { in: projectIds },
        assignedTo: { not: null },
      },
      _count: { assignedTo: true },
    }),
  ]);

  const assigneeIds = tasksByUser.map((t) => t.assignedTo).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { id: { in: assigneeIds } },
    select: { id: true, name: true },
  });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const tasksByUserWithNames = tasksByUser.map((t) => ({
    userId: t.assignedTo,
    userName: userMap[t.assignedTo] || 'Unknown',
    count: t._count.assignedTo,
  }));

  const statusMap = Object.fromEntries(
    tasksByStatus.map((t) => [t.status, t._count.status])
  );

  res.json({
    totalTasks,
    tasksByStatus: {
      TODO: statusMap.TODO || 0,
      IN_PROGRESS: statusMap.IN_PROGRESS || 0,
      DONE: statusMap.DONE || 0,
    },
    overdueTasks,
    tasksByUser: tasksByUserWithNames,
    projectCount: projectIds.length,
  });
};

module.exports = { getDashboard };
