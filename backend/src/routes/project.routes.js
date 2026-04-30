const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getProjects, createProject, getProject, updateProject, deleteProject,
  getMembers, addMember, removeMember,
} = require('../controllers/project.controller');

router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/members', getMembers);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
