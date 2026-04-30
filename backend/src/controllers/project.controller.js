const prisma = require('../lib/prisma');

const getProjects = async (req, res) => {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.user.id },
    include: {
      project: {
        include: {
          _count: { select: { tasks: true, members: true } },
        },
      },
    },
  });

  const projects = memberships.map((m) => ({
    ...m.project,
    role: m.role,
  }));

  res.json(projects);
};

const createProject = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });

  const project = await prisma.project.create({
    data: {
      name,
      description,
      createdBy: req.user.id,
      members: {
        create: { userId: req.user.id, role: 'ADMIN' },
      },
    },
    include: { _count: { select: { tasks: true, members: true } } },
  });

  res.status(201).json({ ...project, role: 'ADMIN' });
};

const getProject = async (req, res) => {
  const { id } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: req.user.id } },
  });
  if (!membership) return res.status(403).json({ message: 'Access denied' });

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
  });
  if (!project) return res.status(404).json({ message: 'Project not found' });

  res.json({ ...project, role: membership.role });
};

const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: req.user.id } },
  });
  if (!membership || membership.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const project = await prisma.project.update({
    where: { id },
    data: { name, description },
  });
  res.json(project);
};

const deleteProject = async (req, res) => {
  const { id } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: req.user.id } },
  });
  if (!membership || membership.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  await prisma.project.delete({ where: { id } });
  res.json({ message: 'Project deleted' });
};

const getMembers = async (req, res) => {
  const { id } = req.params;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: req.user.id } },
  });
  if (!membership) return res.status(403).json({ message: 'Access denied' });

  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json(members);
};

const addMember = async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;

  const adminMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: req.user.id } },
  });
  if (!adminMembership || adminMembership.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const userToAdd = await prisma.user.findUnique({ where: { email } });
  if (!userToAdd) return res.status(404).json({ message: 'User not found' });

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: userToAdd.id } },
  });
  if (existing) return res.status(409).json({ message: 'User is already a member' });

  const member = await prisma.projectMember.create({
    data: {
      projectId: id,
      userId: userToAdd.id,
      role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.status(201).json(member);
};

const removeMember = async (req, res) => {
  const { id, userId } = req.params;

  const adminMembership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: req.user.id } },
  });
  if (!adminMembership || adminMembership.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  if (userId === req.user.id) {
    return res.status(400).json({ message: 'Cannot remove yourself from project' });
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: id, userId } },
  });
  res.json({ message: 'Member removed' });
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, getMembers, addMember, removeMember };
